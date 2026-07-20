"""Graph Intelligence REST API.

Every endpoint:
  * requires a valid JWT (via ``get_current_active_user``), and
  * requires the ``graph:read`` permission (RBAC middleware), and
  * writes an entry to the audit log recording the query and its subject.

Domain errors are mapped to clean HTTP responses:
  * subject not found          → 404 (GraphNotFoundError)
  * graph database unavailable → 503 (GraphConnectionError)
  * invalid label/argument     → 400 (ValueError)
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_client_ip,
    get_current_active_user,
    require_permissions,
)
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.exceptions import AppHTTPException
from app.graph.connection import GraphConnectionError
from app.graph.dependencies import get_graph_service
from app.graph.models.entities import NodeLabel, TRAVERSABLE_LABELS
from app.graph.schemas.graph import (
    AssociatesResponse,
    FIRProfile,
    GraphResponse,
    OrganizedGroupOut,
    PathResponse,
    PersonProfile,
    RepeatOffenderOut,
    SearchResponse,
)
from app.graph.services.graph_service import GraphNotFoundError, GraphService
from app.models.rbac import User
from app.services import audit
from fastapi import status

router = APIRouter(
    prefix="/graph",
    tags=["graph-intelligence"],
    # Blanket RBAC gate: every route below requires graph:read. Individual
    # routes still declare the current-user dependency to capture the actor.
    dependencies=[Depends(require_permissions("graph:read"))],
)


class ServiceUnavailableError(AppHTTPException):
    def __init__(self, detail: str = "graph database unavailable"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
            code="graph_unavailable",
        )


def _audit(
    db: Session,
    request: Request,
    user: User,
    action: str,
    resource: Optional[str] = None,
    detail: Optional[dict] = None,
    status_str: str = "success",
) -> None:
    audit.record(
        db,
        action=action,
        user_id=user.user_id,
        resource=resource,
        status=status_str,
        ip_address=get_client_ip(request),
        detail=detail,
    )


def _guard(db, request, user, action, resource, fn):
    """Run a service call, audit the outcome, and translate domain errors."""
    try:
        result = fn()
    except GraphNotFoundError as exc:
        _audit(db, request, user, action, resource, {"error": str(exc)}, "failure")
        raise NotFoundError(str(exc), code="graph_not_found")
    except ValueError as exc:
        _audit(db, request, user, action, resource, {"error": str(exc)}, "failure")
        raise BadRequestError(str(exc), code="invalid_argument")
    except GraphConnectionError as exc:
        _audit(db, request, user, action, resource, {"error": str(exc)}, "failure")
        raise ServiceUnavailableError(str(exc))
    _audit(db, request, user, action, resource)
    return result


# ── GET /graph/network ─────────────────────────────────────────────────────
@router.get(
    "/network",
    response_model=GraphResponse,
    summary="Full network traversal around a root entity",
)
def get_network(
    request: Request,
    root_id: str = Query(..., description="Business id of the root node"),
    label: str = Query(
        NodeLabel.PERSON,
        description=f"Root node label. One of: {sorted(TRAVERSABLE_LABELS)}",
    ),
    depth: int = Query(2, ge=1, le=5, description="Traversal depth (hops)"),
    service: GraphService = Depends(get_graph_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "graph.network", f"{label}:{root_id}",
        lambda: service.get_network(label, root_id, depth),
    )


# ── GET /graph/person/{person_id} ──────────────────────────────────────────
@router.get(
    "/person/{person_id}",
    response_model=PersonProfile,
    summary="Person profile: FIRs, associates, phones, accounts + ego graph",
)
def get_person(
    person_id: str,
    request: Request,
    service: GraphService = Depends(get_graph_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "graph.person", f"Person:{person_id}",
        lambda: service.get_person_profile(person_id),
    )


# ── GET /graph/fir/{fir_id} ────────────────────────────────────────────────
@router.get(
    "/fir/{fir_id}",
    response_model=FIRProfile,
    summary="FIR profile: accused, victims, witnesses, crimes, locations",
)
def get_fir(
    fir_id: str,
    request: Request,
    service: GraphService = Depends(get_graph_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    def _profile():
        # Primary: rich CSV case graph (1200 synthetic FIRs with narrative).
        from app.graph import csv_graph
        profile = csv_graph.get_fir_profile(fir_id)
        if profile is not None:
            return profile
        # Fallback: Neo4j (externally ingested FIRs).
        return service.get_fir_profile(fir_id)

    return _guard(
        db, request, current_user, "graph.fir", f"FIR:{fir_id}", _profile,
    )


# ── GET /graph/associates/{person_id} ──────────────────────────────────────
@router.get(
    "/associates/{person_id}",
    response_model=AssociatesResponse,
    summary="Direct associates + common (2nd-degree) associates of a person",
)
def get_associates(
    person_id: str,
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    service: GraphService = Depends(get_graph_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "graph.associates", f"Person:{person_id}",
        lambda: service.get_associates(person_id, limit),
    )


# ── GET /graph/repeat-offenders ────────────────────────────────────────────
@router.get(
    "/repeat-offenders",
    response_model=list[RepeatOffenderOut],
    summary="Persons accused in multiple FIRs",
)
def get_repeat_offenders(
    request: Request,
    min_firs: int = Query(2, ge=2, le=50, description="Minimum FIR count"),
    limit: int = Query(100, ge=1, le=500),
    service: GraphService = Depends(get_graph_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "graph.repeat_offenders", None,
        lambda: service.get_repeat_offenders(min_firs, limit),
    )


# ── GET /graph/organized-groups ────────────────────────────────────────────
@router.get(
    "/organized-groups",
    response_model=list[OrganizedGroupOut],
    summary="Detected organized crime groups (co-offending communities)",
)
def get_organized_groups(
    request: Request,
    min_shared_firs: int = Query(
        1, ge=1, le=20, description="Min shared FIRs to link two members"
    ),
    limit: int = Query(50, ge=1, le=200),
    service: GraphService = Depends(get_graph_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "graph.organized_groups", None,
        lambda: service.get_organized_groups(min_shared_firs, limit),
    )


# ── GET /graph/search ──────────────────────────────────────────────────────
@router.get(
    "/search",
    response_model=SearchResponse,
    summary="Search nodes by id/name, optionally scoped to a label",
)
def search(
    request: Request,
    q: str = Query(..., min_length=1, max_length=200, description="Search term"),
    label: Optional[str] = Query(None, description="Optional label filter"),
    limit: int = Query(50, ge=1, le=200),
    service: GraphService = Depends(get_graph_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "graph.search", q,
        lambda: service.search(q, label, limit),
    )


# ── GET /graph/path ────────────────────────────────────────────────────────
@router.get(
    "/path",
    response_model=PathResponse,
    summary="Shortest path between two entities",
)
def get_path(
    request: Request,
    source_id: str = Query(..., description="Source node business id"),
    target_id: str = Query(..., description="Target node business id"),
    source_label: str = Query(NodeLabel.PERSON),
    target_label: str = Query(NodeLabel.PERSON),
    max_depth: int = Query(5, ge=1, le=5),
    service: GraphService = Depends(get_graph_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    resource = f"{source_label}:{source_id}->{target_label}:{target_id}"
    return _guard(
        db, request, current_user, "graph.path", resource,
        lambda: service.get_shortest_path(
            source_label, source_id, target_label, target_id, max_depth
        ),
    )


# ── GET /graph/firs/list ───────────────────────────────────────────────────
@router.get(
    "/firs/list",
    summary="List all FIRs in the system",
)
def list_firs(
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    service: GraphService = Depends(get_graph_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    def _list():
        # Primary: rich CSV case graph (has crime_type, modus_operandi, district).
        from app.graph import csv_graph
        rows = csv_graph.list_firs(limit)
        if rows:
            return rows
        # Fallback: Neo4j.
        return service.list_firs(limit)

    return _guard(
        db, request, current_user, "graph.list_firs", None, _list,
    )


# ── GET /graph/fir/{fir_id}/timeline ──────────────────────────────────────
@router.get(
    "/fir/{fir_id}/timeline",
    summary="Get investigation timeline for an FIR",
)
def get_fir_timeline(
    fir_id: str,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from app.chat.graph_tools import investigation_timeline
    return _guard(
        db, request, current_user, "graph.fir_timeline", f"FIR:{fir_id}",
        lambda: investigation_timeline(fir_id),
    )


# ── GET /graph/fir/{fir_id}/similar ────────────────────────────────────────
@router.get(
    "/fir/{fir_id}/similar",
    summary="Get similar past cases for an FIR",
)
def get_fir_similar(
    fir_id: str,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from app.chat.graph_tools import similar_cases
    return _guard(
        db, request, current_user, "graph.fir_similar", f"FIR:{fir_id}",
        lambda: similar_cases(fir_id),
    )


# ── GET /graph/fir/{fir_id}/leads ──────────────────────────────────────────
@router.get(
    "/fir/{fir_id}/leads",
    summary="Get recommended leads for an FIR",
)
def get_fir_leads(
    fir_id: str,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from app.chat.graph_tools import suggest_leads
    return _guard(
        db, request, current_user, "graph.fir_leads", f"FIR:{fir_id}",
        lambda: suggest_leads(fir_id),
    )

