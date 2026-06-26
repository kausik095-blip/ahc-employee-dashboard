from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.models import Employee

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

_credentials_exc = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_employee(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Employee:
    payload = decode_access_token(token)
    if payload is None:
        raise _credentials_exc
    employee_id = payload.get("sub")
    if not employee_id:
        raise _credentials_exc
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if employee is None or not employee.is_active:
        raise _credentials_exc
    return employee
