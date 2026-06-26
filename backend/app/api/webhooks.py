from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Booking, BookingStatus
from app.schemas.schemas import BookingOut, CompletionEvent
from app.services.audit import record_audit
from app.services.hr_client import push_to_hr
from app.api.bookings import serialize

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


def _verify_secret(x_hospital_secret: str | None) -> None:
    if x_hospital_secret != settings.hospital_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid hospital webhook secret.",
        )


@router.post("/hospital/completion", response_model=BookingOut)
def hospital_completion(
    event: CompletionEvent,
    db: Session = Depends(get_db),
    x_hospital_secret: str | None = Header(default=None),
) -> BookingOut:
    """Hospital partner notifies that an appointment has been completed.

    Authenticated with a shared secret header. Marks the booking Completed,
    records an audit entry, and pushes the new status to the HR portal.
    """
    _verify_secret(x_hospital_secret)

    booking = (
        db.query(Booking)
        .options(joinedload(Booking.hospital), joinedload(Booking.employee))
        .filter(Booking.id == event.booking_id)
        .first()
    )
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot complete a cancelled appointment.",
        )

    booking.status = BookingStatus.COMPLETED
    completed_at = event.completed_at or datetime.now(timezone.utc)

    sync_status, detail = push_to_hr(booking)
    booking.hr_sync_status = sync_status
    booking.hr_sync_detail = detail

    record_audit(
        db,
        actor="hospital-webhook",
        action="booking_completed",
        entity_type="booking",
        entity_id=str(booking.id),
        detail=f"Completion event received (completed_at={completed_at.isoformat()}). "
        f"HR sync={sync_status.value} ({detail})",
        commit=False,
    )
    db.commit()
    db.refresh(booking)
    return serialize(booking)
