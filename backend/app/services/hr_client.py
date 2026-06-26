import logging

import httpx

from app.core.config import settings
from app.models.models import Booking, HRSyncStatus
from app.schemas.schemas import HRUpdatePayload

logger = logging.getLogger("ahc.hr_client")


def build_payload(booking: Booking) -> HRUpdatePayload:
    return HRUpdatePayload(
        employee_id=booking.employee.employee_id,
        employee_name=booking.employee.name,
        department=booking.employee.department,
        hospital_name=booking.hospital.name,
        hospital_location=booking.hospital.location,
        appointment_date=booking.appointment_date,
        appointment_time=booking.appointment_time,
        ahc_status=booking.status.value,
    )


def push_to_hr(booking: Booking) -> tuple[HRSyncStatus, str]:
    """Call the HR REST API to update the HR portal for a booking.

    Returns the resulting sync status and a human-readable detail string.
    Network/HTTP failures are caught so a failed HR sync never breaks the
    employee-facing booking flow; the booking is flagged for retry instead.
    """
    payload = build_payload(booking)
    headers = {"Authorization": f"Bearer {settings.hr_api_key}", "Content-Type": "application/json"}

    try:
        response = httpx.post(
            settings.hr_api_url,
            json=payload.model_dump(),
            headers=headers,
            timeout=10.0,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        detail = f"HR API returned {exc.response.status_code}: {exc.response.text[:300]}"
        logger.warning("HR sync failed for booking %s: %s", booking.id, detail)
        return HRSyncStatus.FAILED, detail
    except httpx.HTTPError as exc:
        detail = f"HR API request error: {exc}"
        logger.warning("HR sync failed for booking %s: %s", booking.id, detail)
        return HRSyncStatus.FAILED, detail

    detail = f"HR portal updated (AHC Status={payload.ahc_status})"
    logger.info("HR sync succeeded for booking %s", booking.id)
    return HRSyncStatus.SYNCED, detail
