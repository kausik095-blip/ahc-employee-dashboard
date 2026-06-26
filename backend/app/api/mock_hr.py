"""Built-in mock HR portal.

This simulates the external HR REST API so the booking -> HR sync flow works
end-to-end out of the box. In production, point HR_API_URL at the real HR
portal and this module can be ignored or removed.
"""
import logging

from fastapi import APIRouter, Header, HTTPException, status

from app.core.config import settings
from app.schemas.schemas import HRUpdatePayload

logger = logging.getLogger("ahc.mock_hr")

router = APIRouter(prefix="/mock-hr", tags=["mock-hr"])

# In-memory store of the latest AHC status the HR portal has "received" per employee.
_hr_records: dict[str, dict] = {}


@router.post("/ahc-updates")
def receive_ahc_update(
    payload: HRUpdatePayload,
    authorization: str | None = Header(default=None),
) -> dict:
    expected = f"Bearer {settings.hr_api_key}"
    if authorization != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid HR API key.")

    _hr_records[payload.employee_id] = payload.model_dump()
    logger.info(
        "HR portal received AHC update for %s: %s @ %s -> %s",
        payload.employee_id,
        payload.hospital_name,
        payload.appointment_date,
        payload.ahc_status,
    )
    return {"status": "ok", "message": "HR portal updated", "received": payload.model_dump()}


@router.get("/ahc-updates")
def list_ahc_updates(authorization: str | None = Header(default=None)) -> dict:
    expected = f"Bearer {settings.hr_api_key}"
    if authorization != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid HR API key.")
    return {"records": list(_hr_records.values())}
