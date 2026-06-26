"""Seed the database with the three partner hospitals and demo employees.

Idempotent: running multiple times will not create duplicates.
Run with: python -m app.seed
"""
import logging

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.models import Employee, Hospital

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ahc.seed")

HOSPITALS = [
    {
        "name": "Apollo Hospitals",
        "location": "Greams Road, Chennai",
        "logo_url": "https://upload.wikimedia.org/wikipedia/en/3/3b/Apollo_Hospitals_Logo.svg",
        "available_slots": 12,
        "description": "Multi-specialty tertiary care with comprehensive annual health checkup packages.",
    },
    {
        "name": "Fortis Hospital",
        "location": "Bannerghatta Road, Bengaluru",
        "logo_url": "https://upload.wikimedia.org/wikipedia/en/8/89/Fortis_Healthcare_Logo.svg",
        "available_slots": 8,
        "description": "Advanced diagnostics and preventive health programs for corporate employees.",
    },
    {
        "name": "MGM Healthcare",
        "location": "Aminjikarai, Chennai",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Logo_2008.svg/320px-Logo_2008.svg.png",
        "available_slots": 10,
        "description": "Quaternary care hospital offering executive health screening services.",
    },
]

EMPLOYEES = [
    {
        "employee_id": "AHC1001",
        "name": "Aarthi Rajan",
        "email": "aarthi.rajan@company.com",
        "department": "Engineering",
        "password": "Password@123",
    },
    {
        "employee_id": "AHC1002",
        "name": "Vikram Shah",
        "email": "vikram.shah@company.com",
        "department": "Finance",
        "password": "Password@123",
    },
    {
        "employee_id": "AHC1003",
        "name": "Priya Nair",
        "email": "priya.nair@company.com",
        "department": "Human Resources",
        "password": "Password@123",
    },
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for h in HOSPITALS:
            existing = db.query(Hospital).filter(Hospital.name == h["name"]).first()
            if existing is None:
                db.add(Hospital(**h))
                logger.info("Added hospital: %s", h["name"])

        for e in EMPLOYEES:
            existing = db.query(Employee).filter(Employee.employee_id == e["employee_id"]).first()
            if existing is None:
                db.add(
                    Employee(
                        employee_id=e["employee_id"],
                        name=e["name"],
                        email=e["email"].lower(),
                        department=e["department"],
                        hashed_password=hash_password(e["password"]),
                    )
                )
                logger.info("Added employee: %s (%s)", e["name"], e["employee_id"])

        db.commit()
        logger.info("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
