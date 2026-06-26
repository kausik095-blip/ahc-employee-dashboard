# AHC Employee Dashboard

A production-quality **Annual Health Checkup (AHC)** booking portal for employees. Employees
log in with their company email or Employee ID, browse partner hospitals, book / reschedule /
cancel appointments, and track booking history and status. Every booking action is automatically
synced to the HR portal via a REST API, and appointments are auto-completed when the hospital
sends a completion event.

## Tech Stack

| Layer     | Technology                                            |
| --------- | ----------------------------------------------------- |
| Frontend  | React (Vite), Material UI, React Router, MUI Date Pickers |
| Backend   | FastAPI (Python 3.12), SQLAlchemy 2.0, Pydantic v2    |
| Database  | PostgreSQL 16                                          |
| Auth      | JWT (OAuth2 bearer)                                    |

## Features

- **JWT authentication** — log in with **company email _or_ Employee ID** + password.
- **Partner hospitals** — Apollo Hospitals, Fortis Hospital, MGM Healthcare shown as responsive
  cards with logo, location, available slots, and a **Book Appointment** button.
- **Booking flow** — select hospital, appointment date, and time; confirm.
- **HR portal sync** — on every booking / reschedule / cancel / completion, the backend calls the
  HR REST API with Employee ID, Name, Department, Hospital Name, Hospital Location, Appointment
  Date, Appointment Time, and AHC Status. A built-in **mock HR portal** is included so the flow
  works end-to-end out of the box; point `HR_API_URL` at the real HR portal in production.
- **Reschedule & cancel** appointments with confirmation.
- **Booking history & current status** — Booked / Rescheduled / Cancelled / Completed, plus HR
  sync status (Synced / Pending / Failed).
- **Completion events** — a secured webhook (`/api/webhooks/hospital/completion`) auto-updates an
  appointment to **Completed** when the hospital notifies the portal.
- **Audit logs** — every login, booking, reschedule, cancel, and completion is recorded.
- **Error handling** — clean, user-friendly errors on both API and UI.
- **Responsive enterprise UI** — preserves a consistent corporate dashboard design across screens.

## Architecture

```
Employee (browser)
      │  JWT
      ▼
React + MUI  ──/api──►  FastAPI  ──►  PostgreSQL
                          │
                          ├── HR REST API (HR_API_URL)  ◄── mock-hr portal (built in)
                          └── Hospital completion webhook ──► status = Completed
```

## Getting Started

### Prerequisites

- Python 3.12+, Node 18+, and either Docker (for Postgres) or a local PostgreSQL 16 instance.

### 1. Start PostgreSQL

```bash
docker compose up -d        # starts Postgres on localhost:5432
```

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # adjust values as needed
python -m app.seed          # creates tables + seeds hospitals & demo employees
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :8000)
```

## Demo Credentials

| Employee ID | Email                       | Password       | Department      |
| ----------- | --------------------------- | -------------- | --------------- |
| AHC1001     | aarthi.rajan@company.com    | Password@123   | Engineering     |
| AHC1002     | vikram.shah@company.com     | Password@123   | Finance         |
| AHC1003     | priya.nair@company.com      | Password@123   | Human Resources |

## Key API Endpoints

| Method | Path                                  | Description                                   |
| ------ | ------------------------------------- | --------------------------------------------- |
| POST   | `/api/auth/login`                     | Login with email or Employee ID → JWT         |
| GET    | `/api/auth/me`                        | Current employee profile                      |
| GET    | `/api/hospitals`                      | List partner hospitals                        |
| GET    | `/api/bookings`                       | Employee's booking history                    |
| POST   | `/api/bookings`                       | Create a booking (triggers HR sync)           |
| PUT    | `/api/bookings/{id}/reschedule`       | Reschedule (triggers HR sync)                 |
| POST   | `/api/bookings/{id}/cancel`           | Cancel (triggers HR sync)                     |
| POST   | `/api/webhooks/hospital/completion`   | Hospital completion event → status Completed  |
| GET    | `/api/audit-logs`                     | Audit trail for the current employee          |
| POST   | `/mock-hr/ahc-updates`                | Built-in mock HR portal receiver              |

### Simulating a hospital completion event

```bash
curl -X POST http://localhost:8000/api/webhooks/hospital/completion \
  -H 'Content-Type: application/json' \
  -H 'X-Hospital-Secret: hospital-webhook-secret' \
  -d '{"booking_id": 1}'
```

## Configuration

All backend configuration is via environment variables (see `backend/.env.example`):

| Variable                  | Purpose                                              |
| ------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string                         |
| `JWT_SECRET_KEY`          | Secret for signing JWTs (**change in production**)    |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime                                   |
| `CORS_ORIGINS`            | Comma-separated allowed origins                      |
| `HR_API_URL`              | HR portal REST endpoint (defaults to the mock)       |
| `HR_API_KEY`              | Bearer key sent to the HR portal                     |
| `HOSPITAL_WEBHOOK_SECRET` | Shared secret hospitals use for completion webhooks  |

## Project Structure

```
ahc-employee-dashboard/
├── backend/
│   └── app/
│       ├── api/         # auth, hospitals, bookings, webhooks, audit, mock_hr routers
│       ├── core/        # config, database, security (JWT), deps
│       ├── models/      # SQLAlchemy models (Employee, Hospital, Booking, AuditLog)
│       ├── schemas/     # Pydantic schemas
│       ├── services/    # HR client + audit logging
│       ├── main.py      # app factory, CORS, error handlers
│       └── seed.py      # idempotent seed data
└── frontend/
    └── src/
        ├── api/         # axios client + endpoint wrappers
        ├── auth/        # JWT auth context
        ├── components/  # AppHeader, HospitalCard, BookingDialog, BookingsTable, StatusChip
        ├── pages/       # LoginPage, DashboardPage
        └── theme/       # MUI enterprise theme
```
