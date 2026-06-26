from sqlalchemy.orm import Session

from app.models.models import AuditLog


def record_audit(
    db: Session,
    *,
    actor: str,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    detail: str | None = None,
    commit: bool = True,
) -> AuditLog:
    """Persist an audit log entry. Caller controls commit to allow batching."""
    log = AuditLog(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        detail=detail,
    )
    db.add(log)
    if commit:
        db.commit()
    return log
