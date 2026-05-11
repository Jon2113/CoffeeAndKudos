# CoffeeAndKudos

A full-stack web application for small teams to keep track of borrowed items and informal favors exchanged between members. Each user gets a personal dashboard showing what is still open with the rest of the team, both as global counts and one-on-one balances.

Built as the final project for the **Applied Programming (CDIBO1202E)** course at Copenhagen Business School (Spring 2026).

> 📄 The full design rationale, architecture decisions, and reflections are documented in the project report. This README is a developer setup guide for getting the app running locally.

---

## Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| **Frontend** | Angular 21 (standalone components) + Angular Material |
| **Backend**  | ASP.NET Core Web API (C#) + Npgsql                  |
| **Database** | PostgreSQL hosted on [Supabase](https://supabase.com) |
| **Testing**  | xUnit + Moq (backend), vitest (frontend)            |
| **API docs** | Swagger / OpenAPI                                   |

---

## Prerequisites

- **.NET SDK 8.0** or newer — <https://dotnet.microsoft.com/download>
- **Node.js** ≥ 20.19, 22.12, or 24 (the version range Angular 21 supports)
- **npm** (bundled with Node)
- A PostgreSQL database — either:
  - a free Supabase project (recommended, matches our deployment), or
  - a local Postgres instance (16+)

---

## Project Structure

```
.
├── backend/                     # backend
    ├── CoffeeAndKudos.API/        # ASP.NET Core Web API (controllers, Program.cs)
    ├── CoffeeAndKudos.Model/      # Entities + repositories (data-access layer)
    ├── CoffeeAndKudos.Tests/      # xUnit + Moq unit tests for the controllers
├── frontend/                    # Angular frontend
│   ├── src/app/
│   │   ├── pages/                 # login, dashboard
│   │   ├── components/            # scale, activity-log, create-entry
│   │   ├── services/              # user, borrow, favor services + auth guard
│   │   └── models/                # TS interfaces matching the API contract
│   └── proxy.conf.json            # forwards /api/* to the backend in dev
├── seed.sql                       # full schema + seed data (idempotent)
├── PROJ_BACKEND.slnx              # .NET solution file
└── docs/                          # written report and supporting documents
```

---

## Setup

### 1. Clone

```bash
git clone <repo-url> CoffeeAndKudos
cd CoffeeAndKudos
```

### 2. Database

The schema and seed data live in **`seed.sql`**. The script is idempotent — it drops and recreates everything, so it is safe to re-run.

**Option A: Supabase (recommended)**

1. Create a new project at <https://supabase.com>.
2. Open the SQL editor and run the contents of `seed.sql`.
3. From _Project Settings → Database_, copy the connection details (host, port, database name, user, password). The host typically looks like `aws-1-eu-central-1.pooler.supabase.com`.

**Option B: Local PostgreSQL**

```bash
createdb coffeeandkudos
psql -d coffeeandkudos -f seed.sql
```

### 3. Backend configuration

The backend reads its connection string from `CoffeeAndKudos.API/appsettings.json`, but the **password is never committed**. It is resolved at runtime from one of the following sources (in this order):

1. `ConnectionStrings:AppProgDbPassword` via .NET User Secrets — **recommended for local development**
2. `SUPABASE_DB_PASSWORD` environment variable — for Supabase-hosted deployments
3. `DB_PASSWORD` environment variable — generic fallback

Set the password via User Secrets:

```bash
cd CoffeeAndKudos.API
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:AppProgDbPassword" "<your-db-password>"
```

If you are not using our Supabase instance, also adjust `Host`, `Username`, and `Port` in `appsettings.json`.

### 4. Frontend

```bash
cd frontend
npm install
```

---

## Running the app

You need **two terminals** — one for the backend, one for the frontend.

**Terminal 1 — Backend** (from repo root):

```bash
dotnet run --project CoffeeAndKudos.API
```

The API will start on `http://localhost:5175` (HTTP) and `https://localhost:7175` (HTTPS). Swagger UI is available at `http://localhost:5175/swagger`.

**Terminal 2 — Frontend** (from `frontend/`):

```bash
npm start
```

The Angular dev server runs on `http://localhost:4200`. The proxy in `proxy.conf.json` forwards every `/api/*` request to the backend, so the frontend code never hard-codes a backend URL.

Open <http://localhost:4200> in your browser — you should land on the profile picker.

---

## Testing

**Backend (xUnit + Moq):**

```bash
dotnet test
```

Covers all three controllers (`UserController`, `BorrowsController`, `FavorsController`) across every CRUD endpoint, with both happy-path and failure-path scenarios. Repositories are mocked via Moq, so the tests do not touch a real database.

**Frontend (vitest):**

```bash
cd frontend
npm test
```

---

## API overview

All endpoints follow `api/{controller}` and support full CRUD via standard HTTP verbs:

| Method   | Route                  | Description                |
| -------- | ---------------------- | -------------------------- |
| `GET`    | `/api/User`            | list all users             |
| `GET`    | `/api/User/{id}`       | fetch one user             |
| `POST`   | `/api/User`            | create a user              |
| `PUT`    | `/api/User`            | update a user              |
| `DELETE` | `/api/User/{id}`       | delete a user              |
| `GET`    | `/api/Borrows`         | list all borrows           |
| `GET`    | `/api/Borrows/{id}`    | fetch one borrow           |
| `POST`   | `/api/Borrows`         | create a borrow            |
| `PUT`    | `/api/Borrows`         | update a borrow            |
| `DELETE` | `/api/Borrows/{id}`    | delete a borrow            |
| `GET`    | `/api/Favors`          | list all favors            |
| `GET`    | `/api/Favors/{id}`     | fetch one favor            |
| `POST`   | `/api/Favors`          | create a favor             |
| `PUT`    | `/api/Favors`          | update a favor             |
| `DELETE` | `/api/Favors/{id}`     | delete a favor             |

The full interactive specification is browsable through Swagger UI at `/swagger` while the backend is running.

---

## Architecture in one paragraph

The backend follows the classic layered pattern taught in the course: thin controllers that delegate to repository classes inheriting from a shared `BaseRepository`, which handles connection-string resolution and parameterized SQL execution. The frontend follows a component–service architecture: pages and reusable components stay presentational, while services (`UserService`, `BorrowService`, `FavorService`) encapsulate all HTTP calls and expose RxJS observables. Communication between the layers is exclusively JSON over HTTP, with CORS configured to allow the Angular dev server. For the design rationale and trade-offs, see the project report.

---

## Authors

- Felix Plümpe
- Jonas Peifer
- Michael Schäfer

MSc in Business Administration and Digital Business · Copenhagen Business School · Spring 2026