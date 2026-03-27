# Digital ID Project
This repository contains:
- A Node.js + Express backend API in `server/`
- Static frontend pages in `html/` (served by the backend)
- PostgreSQL schema and seed scripts in `database/`

## Prerequisites
Install these first:
- Node.js 18+
- PostgreSQL (with `psql` available in PATH)
- Python 3.10+ (needed for DB seed script and passport service)

## 1) Database Setup

From PowerShell:

```powershell
cd database
# If psql is not in PATH, add your PostgreSQL bin (example path):
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"

# Optional: set credentials if needed
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_NAME = "digital_id"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "your_password"

# Rebuild schema and seed data
.\rebuild_and_seed.ps1
```

This runs:
- `init_database.sql` (schema rebuild)
- `python _scripts/populate_children.py` (seed data)

## 2) Backend Setup and Run

Create a `.env` file inside `server/`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=digital_id
JWT_SECRET=replace_with_a_strong_secret
JWT_REFRESH_SECRET=replace_with_another_strong_secret
```

Then run:

```powershell
cd server
npm install
npm start
```

The API/server runs at:
- `http://localhost:5000`

## 3) Open the Web App

The backend serves frontend files from `html/`, so open:
- `http://localhost:5000/loginPage.html`

You can also access other pages directly (for example `homePage.html`, `hospital.html`, etc.) while the server is running.


## Useful Notes
- If login returns auth errors, verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set in `server/.env`.
- If database connection fails, verify PostgreSQL is running and `DB_*` values match your local setup.
- Use the backend URL (`localhost:5000`) to load frontend pages so API routes like `/api/auth/login` work correctly.
