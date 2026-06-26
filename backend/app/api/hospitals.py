from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_employee
from app.models.models import Employee, Hospital
from app.schemas.schemas import HospitalOut

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])


@router.get("", response_model=list[HospitalOut])
def list_hospitals(
    db: Session = Depends(get_db),
    _: Employee = Depends(get_current_employee),
) -> list[Hospital]:
    return db.query(Hospital).order_by(Hospital.name).all()
