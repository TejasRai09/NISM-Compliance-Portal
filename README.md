# NISM Certificate Compliance Portal

Comprehensive documentation for the full-stack NISM compliance portal (frontend + backend + database + data import scripts).

## 1) What this application does

The portal manages employee NISM certificate compliance end-to-end:

- Employee authentication via OTP-based signup and password reset.
- Employee portal to upload certificates, view compliance status, and download files.
- Admin portal to manage employees, review/approve/reject certificates, and view compliance analytics.
- Excel import utilities for employees and certificate types.
- One-command production start from the repository root.

## 2) High-level architecture

- Frontend: React 19 + Vite + TypeScript + Tailwind CDN.
- Backend: Node.js + Express (REST API) + MySQL.
- Storage:
  - MySQL for employees, certificates, certificate types, and users.
  - Local file storage for certificate uploads in backend/uploads.
- Deployment mode: The backend serves the built frontend assets from frontend/dist.

## 3) Project structure

- backend/ – Express API, database access, upload storage, import scripts.
- frontend/ – React app (Vite).
- Book20.xlsx – Employee master file.
- Book22.xlsx – Certificate types file.
- package.json – Root scripts (single command start).

## 4) Prerequisites

- Node.js (18+ recommended)
- MySQL (8+ recommended)
- Access to SMTP credentials (Office365 or Gmail) for OTP delivery

## 5) Environment configuration

Create backend/.env using backend/.env.example as a reference.

Required variables:

- PORT: Backend port (default 4000)
- HOST: Bind address (default 0.0.0.0)
- DB_HOST: MySQL host
- DB_PORT: MySQL port (default 3306)
- DB_USER: MySQL user
- DB_PASSWORD: MySQL password
- DB_NAME: MySQL database (default nism)
- SMTP_HOST: SMTP host (e.g., smtp.office365.com)
- SMTP_PORT: SMTP port (587 typical)
- SMTP_SECURE: true or false
- SMTP_USER: Email account used to send OTPs
- SMTP_PASS: SMTP password/app password

Important:
- OTPs are stored in memory only and expire in 10 minutes.
- Restarting the backend clears all pending OTPs.

## 6) Install and run

### Production-like (single command)

From the repository root:

1) Install & build frontend, then start backend:
   npm start

This triggers:
- backend install
- frontend install
- frontend build
- backend server (serving frontend/dist)

### Local development

Run frontend and backend in separate terminals:

- Frontend: npm run dev (inside frontend)
- Backend: npm run dev (inside backend)

Note: Frontend uses relative /api calls. For local dev, ensure the backend is reachable at the same origin or add a dev proxy in frontend/vite.config.ts if needed.

## 7) Database schema

### employees

- id (INT, PK, auto-increment)
- employee_number (VARCHAR, unique)
- employee_name (VARCHAR)
- designation (VARCHAR)
- department (VARCHAR)
- location (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- manager_email (VARCHAR)
- manager_employee_no (VARCHAR)
- manager_employee_name (VARCHAR)
- created_at (TIMESTAMP)

### certificate_types

- id (INT, PK, auto-increment)
- name (VARCHAR, unique)

### certificates

- id (INT, PK, auto-increment)
- employee_number (VARCHAR)
- module_name (VARCHAR)
- cert_number (VARCHAR)
- issue_date (DATE)
- expiry_date (DATE)
- status (VARCHAR)
- file_name (VARCHAR)
- file_path (VARCHAR)
- created_at (TIMESTAMP)

### users

- id (INT, PK, auto-increment)
- email (VARCHAR, unique)
- password_hash (VARCHAR)
- created_at (TIMESTAMP)

## 8) Data import utilities

### Import employees (Book20.xlsx)

- Script: backend/scripts/import_employees.js
- Command (from root):
  npm --prefix backend run import:employees -- Book20.xlsx

Key Excel column mappings used by the script:
- Employee Number
- Employee Name
- Curr.Designation
- Curr.Department
- Curr.Location
- Email
- Phone
- Manager Email Id
- Manager Employee No
- Manager Employee Name

Duplicate employee numbers are updated in-place.

### Import certificate types (Book22.xlsx)

- Script: backend/scripts/import_modules.js
- Command (from root):
  npm --prefix backend run import:modules -- Book22.xlsx

Column used:
- Type of Certificates

Duplicate names are updated in-place.

## 9) Authentication and OTP flows

### Signup

Endpoint: POST /api/auth/signup
Payload:
- email
- password
- confirmPassword

Rules:
- Email must contain the string "adventz".
- Email must already exist in employees table.
- Passwords must match.

Flow:
- Generates OTP (6 digits).
- Stores OTP + password hash in memory for 10 minutes.
- Sends OTP via SMTP.

### Verify signup OTP

Endpoint: POST /api/auth/verify-otp
Payload:
- email
- otp

Flow:
- Validates OTP.
- Creates users record with stored password hash.

### Login

Endpoint: POST /api/auth/login
Payload:
- email
- password

Flow:
- Verifies password hash.
- Returns employee record for portal session.

### Forgot password

Endpoint: POST /api/auth/forgot-password
Payload:
- email
- password
- confirmPassword

Flow:
- Validates user exists.
- Generates reset OTP and stores in memory.
- Sends OTP via SMTP.

### Verify reset OTP

Endpoint: POST /api/auth/verify-reset-otp
Payload:
- email
- otp

Flow:
- Updates password_hash for the user.

## 10) Certificate lifecycle

1) Employee uploads certificate using the portal.
2) Backend stores file in backend/uploads and inserts a certificates record with status "Pending Approval".
3) Admin reviews in the review queue:
   - Approve: status recalculated based on expiry date.
   - Reject: status set to "Rejected".
4) Employee sees status and file download link.

Status calculation when approving:
- Expired: expiry date < today
- Expiring Soon: expiry date within 60 days
- Compliant: expiry date beyond 60 days

## 11) Frontend features

### Employee portal

- Dashboard with statistics:
  - Total Modules
  - Compliant
  - Expiring Soon
  - Expired
- Search and status filter for certificates.
- Pagination: 7 certificates per page.
- Upload form with module dropdown sourced from certificate_types.
- File upload with preview name.
- Profile view of employee details.

### Admin portal

- Workforce directory (employee list):
  - Search by name or employee number.
  - Department filter.
  - Pagination: 7 employees per page.
  - Shows count of valid certificates (Compliant + Expiring Soon) per employee.
- Employee CRUD:
  - Add, edit, delete.
- Review queue for pending approvals.
- All certificates list with pagination (7 per page).
- Analytics:
  - Total employees
  - Compliance rate
  - Pending reviews
  - Critical expirations (next 30 days)
  - Department compliance grid
  - Module-wise distribution chart

## 12) Backend API reference

### Health & DB
- GET /health
- GET /db/ping

### Employees
- GET /api/employees
- POST /api/employees
- PUT /api/employees/:employeeNumber
- DELETE /api/employees/:employeeNumber

### Certificate types
- GET /api/certificates/types

### Certificates
- GET /api/certificates
  - Optional query params: employeeNumber, email
- POST /api/certificates
  - Form-data: employeeNumber, moduleName, certNumber, issueDate, expiryDate, file
- GET /api/certificates/review
- POST /api/certificates/:id/approve
- POST /api/certificates/:id/reject

### Admin analytics
- GET /api/admin/stats
- GET /api/admin/module-stats

### Auth
- POST /api/auth/signup
- POST /api/auth/verify-otp
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/verify-reset-otp

## 13) File uploads

- Stored in backend/uploads.
- Publicly served at /uploads via Express static.
- File names are sanitized to remove unsafe characters.

## 14) Error handling and UX

- API errors return JSON with status and message.
- Frontend shows toast messages for key actions (upload, auth errors).
- List pages show empty states and loading states.

## 15) Security notes

- Passwords are stored as bcrypt hashes.
- OTPs are in-memory only (not persisted).
- No session/JWT yet; frontend relies on app state after login.
- Validate SMTP credentials and secure them using .env.

## 16) Known constraints

- Development mode requires API availability for frontend /api calls.
- Certificate status is set only after admin approval.
- OTP expires after 10 minutes.

## 17) Maintenance checklist

- Re-import Excel files after changes in Book20.xlsx or Book22.xlsx.
- Back up backend/uploads and MySQL data.
- Keep SMTP credentials valid to avoid signup/reset failures.

## 18) Quick command summary

- npm start (root)
- npm --prefix backend run import:employees -- Book20.xlsx
- npm --prefix backend run import:modules -- Book22.xlsx
- npm --prefix backend run dev
- npm --prefix frontend run dev

## 19) Screenshots

Place any UI screenshots inside screenshot/ and reference them as needed.
