"""Audit logging hooks.

``record`` writes a single audit entry. It is intentionally best-effort: an
audit failure must never break the request that triggered it, so exceptions are
swallowed and logged rather than propagated. Callers pass an already-open
session; the write is committed independently so the audit trail survives even
if the surrounding business transaction later rolls back.
"""
import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.rbac import AuditLog

logger = get_logger("audit")


def record(
    db: Session,
    *,
    action: str,
    user_id: Optional[int] = None,
    resource: Optional[str] = None,
    status: str = "success",
    ip_address: Optional[str] = None,
    detail: Optional[dict[str, Any]] = None,
) -> None:
    """Persist an audit log entry (best-effort)."""
    try:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            status=status,
            ip_address=ip_address,
            detail=json.dumps(detail, default=str) if detail else None,
        )
        db.add(entry)
        db.commit()
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Failed to write audit log for action '%s': %s", action, exc)
        try:
            db.rollback()
        except Exception:
            pass
