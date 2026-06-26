from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_employee
from app.core.security import create_access_token, verify_password
from app.models.models import Employee
from app.schemas.schemas import EmployeeOut, LoginRequest, Token
from app.services.audit import record_audit

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _find_employee(db: Session, identifier: str) -> Employee | None:
    identifier = identifier.strip()
    return (
        db.query(Employee)
        .filter((Employee.email == identifier.lower()) | (Employee.employee_id == identifier))
        .first()
    )


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    employee = _find_employee(db, payload.identifier)
    if employee is None or not verify_password(payload.password, employee.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Use your company email or Employee ID and password.",
        )
    if not employee.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive.")

    record_audit(
        db,
        actor=employee.employee_id,
        action="login",
        entity_type="employee",
        entity_id=employee.employee_id,
        detail="Successful login",
    )
    token = create_access_token(subject=employee.employee_id, extra_claims={"name": employee.name})
    return Token(access_token=token)


@router.get("/me", response_model=EmployeeOut)
def me(current: Employee = Depends(get_current_employee)) -> Employee:
    return current
