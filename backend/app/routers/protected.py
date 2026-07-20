"""Protected resource endpoints.

These demonstrate the RBAC enforcement layer that the Graph Intelligence and
Financial Crime modules will build on. They deliberately contain NO domain
logic — each returns a stub payload — but each is gated exactly as the real
endpoints will be, so wiring the guards is done and tested up front.
"""
from fastapi import APIRouter, Depends

from app.core.dependencies import (
    get_current_active_user,
    require_permissions,
    require_roles,
)
from app.models.rbac import User

router = APIRouter(prefix="/secure", tags=["protected"])


@router.get(
    "/profile-scope",
    summary="Any authenticated user — echoes the caller's data scope",
)
def profile_scope(current_user: User = Depends(get_current_active_user)):
    """Returns the caller's district scope + effective permissions. Downstream
    modules use ``district_id`` to filter records for non-superusers."""
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "district_id": current_user.district_id,
        "roles": sorted(current_user.role_names),
        "permissions": sorted(current_user.permission_codes),
        "is_superuser": current_user.is_superuser,
    }


@router.get(
    "/graph-preview",
    summary="Requires 'graph:read' permission (placeholder for Graph Intelligence)",
    dependencies=[Depends(require_permissions("graph:read"))],
)
def graph_preview():
    return {"module": "graph-intelligence", "status": "authorized", "data": None}


@router.get(
    "/financial-preview",
    summary="Requires 'financial:read' permission (placeholder for Financial Crime)",
    dependencies=[Depends(require_permissions("financial:read"))],
)
def financial_preview():
    return {"module": "financial-crime", "status": "authorized", "data": None}


@router.get(
    "/analyst-area",
    summary="Requires the 'analyst' or 'admin' role",
    dependencies=[Depends(require_roles("analyst", "admin"))],
)
def analyst_area():
    return {"area": "analyst", "status": "authorized"}
