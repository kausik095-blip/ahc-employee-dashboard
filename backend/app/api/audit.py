from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_employee
from app.models.models import AuditLog, Booking, Employee
from app.schemas.schemas import AuditLogOut

router = APIRouter(prefix="/api/audit-logs", tags=["audit"])


@router.get("", response_model=list[AuditLogOut])
def my_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current: Employee = Depends(get_current_employee),
) -> list[AuditLog]:
    """Return audit entries relevant to the current employee.

    Includes actions performed by the employee plus completion events on their
    own bookings (recorded by the hospital webhook actor).
    """
    booking_ids = [str(b.id) for b in db.query(Booking.id).filter(Booking.employee_id == current.id).all()]

    query = db.query(AuditLog).filter(
        (AuditLog.actor == current.employee_id)
        | ((AuditLog.entity_type == "booking") & (AuditLog.entity_id.in_(booking_ids)))
    )
    return query.order_by(AuditLog.created_at.desc()).limit(min(limit, 500)).all()
