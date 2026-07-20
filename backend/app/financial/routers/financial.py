"""Financial Crime & Transaction Link Analysis REST API.

Every endpoint:
  * requires a valid JWT (``get_current_active_user``),
  * requires the ``financial:read`` permission (RBAC middleware),
  * writes an audit-log entry (success or failure), and
  * handles Neo4j outages gracefully (→ HTTP 503).

Domain error mapping:
  * subject not found          → 404 (FinancialNotFoundError)
  * invalid label/argument     → 400 (ValueError)
  * graph database unavailable → 503 (GraphConnectionError)
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_client_ip,
    get_current_active_user,
    require_permissions,
)
from app.core.exceptions import AppHTTPException, BadRequestError, NotFoundError
from app.financial.dependencies import get_financial_service
from app.financial.models.entities import FINANCIAL_LABELS, NodeLabel
from app.financial.schemas.financial import (
    AccountProfile,
    FinancialNetworkResponse,
    FinancialPathResponse,
    FinancialSearchResponse,
    MoneyTrailResponse,
    PersonFinancialProfile,
    SuspiciousResponse,
    TransactionListResponse,
)
from app.financial.services.financial_service import (
    FinancialNotFoundError,
    FinancialService,
)
from app.graph.connection import GraphConnectionError
from app.models.rbac import User
from app.services import audit

router = APIRouter(
    prefix="/financial",
    tags=["financial-crime"],
    dependencies=[Depends(require_permissions("financial:read"))],
)


class ServiceUnavailableError(AppHTTPException):
    def __init__(self, detail: str = "graph database unavailable"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
            code="graph_unavailable",
        )


def _audit(db, request, user, action, resource, detail=None, status_str="success"):
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
    """Run a service call, audit the outcome, translate domain errors."""
    try:
        result = fn()
    except FinancialNotFoundError as exc:
        _audit(db, request, user, action, resource, {"error": str(exc)}, "failure")
        raise NotFoundError(str(exc), code="financial_not_found")
    except ValueError as exc:
        _audit(db, request, user, action, resource, {"error": str(exc)}, "failure")
        raise BadRequestError(str(exc), code="invalid_argument")
    except GraphConnectionError as exc:
        _audit(db, request, user, action, resource, {"error": str(exc)}, "failure")
        raise ServiceUnavailableError(str(exc))
    _audit(db, request, user, action, resource)
    return result


# ── GET /financial/accounts/{account_no} ───────────────────────────────────
@router.get(
    "/accounts/{account_no}",
    response_model=AccountProfile,
    summary="Bank account profile: owners, in/out transactions, linked accounts",
)
def get_account(
    account_no: str,
    request: Request,
    service: FinancialService = Depends(get_financial_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "financial.account", f"BankAccount:{account_no}",
        lambda: service.get_account_profile(account_no),
    )


# ── GET /financial/person/{person_id} ──────────────────────────────────────
@router.get(
    "/person/{person_id}",
    response_model=PersonFinancialProfile,
    summary="Person financial profile: accounts + transactions traversal",
)
def get_person(
    person_id: str,
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    service: FinancialService = Depends(get_financial_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "financial.person", f"Person:{person_id}",
        lambda: service.get_person_financials(person_id, limit),
    )


# ── GET /financial/transactions ────────────────────────────────────────────
@router.get(
    "/transactions",
    response_model=TransactionListResponse,
    summary="Transaction lookup with amount/method/account filters",
)
def get_transactions(
    request: Request,
    min_amount: float = Query(0.0, ge=0, description="Minimum transaction amount"),
    account: Optional[str] = Query(None, description="Filter to an account_no"),
    method: Optional[str] = Query(None, description="e.g. NEFT / UPI / IMPS"),
    limit: int = Query(100, ge=1, le=500),
    service: FinancialService = Depends(get_financial_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "financial.transactions", account,
        lambda: service.get_transactions(min_amount, account, method, limit),
    )


# ── GET /financial/money-trail ─────────────────────────────────────────────
@router.get(
    "/money-trail",
    response_model=MoneyTrailResponse,
    summary="Follow the money downstream from an account (multi-hop tracing)",
)
def get_money_trail(
    request: Request,
    account_no: str = Query(..., description="Source account_no"),
    depth: int = Query(3, ge=1, le=5, description="Max hops to trace"),
    min_amount: float = Query(0.0, ge=0, description="Min amount on each hop"),
    service: FinancialService = Depends(get_financial_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "financial.money_trail", f"BankAccount:{account_no}",
        lambda: service.get_money_trail(account_no, depth, min_amount),
    )


# ── GET /financial/network ─────────────────────────────────────────────────
@router.get(
    "/network",
    response_model=FinancialNetworkResponse,
    summary="Financial network (accounts + transactions) around a root entity",
)
def get_network(
    request: Request,
    root_id: str = Query(..., description="account_no or person_id of the root"),
    label: str = Query(
        NodeLabel.BANK_ACCOUNT,
        description=f"Root label. One of: {sorted(FINANCIAL_LABELS)}",
    ),
    depth: int = Query(2, ge=1, le=5),
    service: FinancialService = Depends(get_financial_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "financial.network", f"{label}:{root_id}",
        lambda: service.get_network(label, root_id, depth),
    )


# ── GET /financial/suspicious ──────────────────────────────────────────────
@router.get(
    "/suspicious",
    response_model=SuspiciousResponse,
    summary="Suspicious activity: high-value, circular flows, pass-through accts",
)
def get_suspicious(
    request: Request,
    threshold: float = Query(100000.0, ge=0, description="High-value threshold"),
    depth: int = Query(5, ge=2, le=5, description="Max cycle length to detect"),
    limit: int = Query(100, ge=1, le=500),
    service: FinancialService = Depends(get_financial_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "financial.suspicious", None,
        lambda: service.get_suspicious(threshold, depth, limit),
    )


# ── GET /financial/search ──────────────────────────────────────────────────
@router.get(
    "/search",
    response_model=FinancialSearchResponse,
    summary="Search accounts / persons by account_no, bank, name or person_id",
)
def search(
    request: Request,
    q: str = Query(..., min_length=1, max_length=200),
    label: Optional[str] = Query(None, description="Optional label filter"),
    limit: int = Query(50, ge=1, le=200),
    service: FinancialService = Depends(get_financial_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return _guard(
        db, request, current_user, "financial.search", q,
        lambda: service.search(q, label, limit),
    )


# ── GET /financial/path ────────────────────────────────────────────────────
@router.get(
    "/path",
    response_model=FinancialPathResponse,
    summary="Shortest money path (directional transfers) between two accounts",
)
def get_path(
    request: Request,
    source_account: str = Query(..., description="Source account_no"),
    target_account: str = Query(..., description="Target account_no"),
    max_depth: int = Query(5, ge=1, le=5),
    service: FinancialService = Depends(get_financial_service),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    resource = f"{source_account}->{target_account}"
    return _guard(
        db, request, current_user, "financial.path", resource,
        lambda: service.get_money_path(source_account, target_account, max_depth),
    )
