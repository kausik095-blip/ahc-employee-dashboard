from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_employee
from app.models.models import Booking, BookingStatus, Employee, Hospital
from app.schemas.schemas import BookingCreate, BookingOut, BookingReschedule
from app.services.audit import record_audit
from app.services.hr_client import push_to_hr

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

ACTIVE_STATUSES = {BookingStatus.BOOKED, BookingStatus.RESCHEDULED}


def serialize(booking: Booking) -> BookingOut:
    return BookingOut(
        id=booking.id,
        hospital_id=booking.hospital_id,
        hospital_name=booking.hospital.name,
        hospital_location=booking.hospital.location,
        appointment_date=booking.appointment_date,
        appointment_time=booking.appointment_time,
        status=booking.status,
        hr_sync_status=booking.hr_sync_status,
        hr_sync_detail=booking.hr_sync_detail,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


def _validate_slot(appointment_date: str, appointment_time: str) -> None:
    try:
        parsed_date = date.fromisoformat(appointment_date)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid date format, expected YYYY-MM-DD.")
    try:
        datetime.strptime(appointment_time, "%H:%M")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid time format, expected HH:MM.")
    if parsed_date < date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Appointment date cannot be in the past.")


def _sync_and_record(db: Session, booking: Booking, actor: str, action: str) -> None:
    sync_status, detail = push_to_hr(booking)
    booking.hr_sync_status = sync_status
    booking.hr_sync_detail = detail
    record_audit(
        db,
        actor=actor,
        action=action,
        entity_type="booking",
        entity_id=str(booking.id),
        detail=f"{action}: {booking.hospital.name} on {booking.appointment_date} {booking.appointment_time}. "
        f"HR sync={sync_status.value} ({detail})",
        commit=False,
    )
    db.commit()
    db.refresh(booking)


@router.get("", response_model=list[BookingOut])
def list_bookings(
    db: Session = Depends(get_db),
    current: Employee = Depends(get_current_employee),
) -> list[BookingOut]:
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.hospital))
        .filter(Booking.employee_id == current.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [serialize(b) for b in bookings]


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current: Employee = Depends(get_current_employee),
) -> BookingOut:
    _validate_slot(payload.appointment_date, payload.appointment_time)

    hospital = db.get(Hospital, payload.hospital_id)
    if hospital is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found.")
    if hospital.available_slots <= 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No slots available at this hospital.")

    existing_active = (
        db.query(Booking)
        .filter(Booking.employee_id == current.id, Booking.status.in_(ACTIVE_STATUSES))
        .first()
    )
    if existing_active is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an active appointment. Please reschedule or cancel it first.",
        )

    booking = Booking(
        employee_id=current.id,
        hospital_id=hospital.id,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
        status=BookingStatus.BOOKED,
    )
    hospital.available_slots -= 1
    db.add(booking)
    db.commit()
    db.refresh(booking)

    _sync_and_record(db, booking, actor=current.employee_id, action="booking_created")
    return serialize(booking)


@router.put("/{booking_id}/reschedule", response_model=BookingOut)
def reschedule_booking(
    booking_id: int,
    payload: BookingReschedule,
    db: Session = Depends(get_db),
    current: Employee = Depends(get_current_employee),
) -> BookingOut:
    _validate_slot(payload.appointment_date, payload.appointment_time)
    booking = _get_owned_booking(db, booking_id, current)

    if booking.status not in ACTIVE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot reschedule a {booking.status.value.lower()} appointment.",
        )

    booking.appointment_date = payload.appointment_date
    booking.appointment_time = payload.appointment_time
    booking.status = BookingStatus.RESCHEDULED
    db.commit()
    db.refresh(booking)

    _sync_and_record(db, booking, actor=current.employee_id, action="booking_rescheduled")
    return serialize(booking)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current: Employee = Depends(get_current_employee),
) -> BookingOut:
    booking = _get_owned_booking(db, booking_id, current)

    if booking.status not in ACTIVE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot cancel a {booking.status.value.lower()} appointment.",
        )

    booking.status = BookingStatus.CANCELLED
    # Release the slot back to the hospital pool.
    if booking.hospital is not None:
        booking.hospital.available_slots += 1
    db.commit()
    db.refresh(booking)

    _sync_and_record(db, booking, actor=current.employee_id, action="booking_cancelled")
    return serialize(booking)


def _get_owned_booking(db: Session, booking_id: int, current: Employee) -> Booking:
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.hospital), joinedload(Booking.employee))
        .filter(Booking.id == booking_id)
        .first()
    )
    if booking is None or booking.employee_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")
    return booking
