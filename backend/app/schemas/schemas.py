from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.models import BookingStatus, HRSyncStatus


# ---------- Auth ----------
class LoginRequest(BaseModel):
    # Accepts company email OR Employee ID in a single field.
    identifier: str = Field(..., description="Company email or Employee ID")
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: str
    name: str
    email: str
    department: str


# ---------- Hospitals ----------
class HospitalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location: str
    logo_url: str
    available_slots: int
    description: str | None = None


# ---------- Bookings ----------
class BookingCreate(BaseModel):
    hospital_id: int
    appointment_date: str = Field(..., description="ISO date YYYY-MM-DD")
    appointment_time: str = Field(..., description="HH:MM 24-hour")


class BookingReschedule(BaseModel):
    appointment_date: str = Field(..., description="ISO date YYYY-MM-DD")
    appointment_time: str = Field(..., description="HH:MM 24-hour")


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    hospital_id: int
    hospital_name: str
    hospital_location: str
    appointment_date: str
    appointment_time: str
    status: BookingStatus
    hr_sync_status: HRSyncStatus
    hr_sync_detail: str | None = None
    created_at: datetime
    updated_at: datetime


# ---------- HR integration payloads ----------
class HRUpdatePayload(BaseModel):
    employee_id: str
    employee_name: str
    department: str
    hospital_name: str
    hospital_location: str
    appointment_date: str
    appointment_time: str
    ahc_status: str


# ---------- Hospital completion webhook ----------
class CompletionEvent(BaseModel):
    booking_id: int
    completed_at: datetime | None = None


# ---------- Audit ----------
class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor: str
    action: str
    entity_type: str
    entity_id: str | None = None
    detail: str | None = None
    created_at: datetime
