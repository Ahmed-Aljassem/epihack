# 🦠 EpiRadar — Participatory Epidemic Surveillance System

A **One Health** early-warning platform that collects participatory survey data
across **human**, **animal**, and **environmental** domains, then applies
automated anomaly detection to flag potential epidemic or pandemic signals.

---

## Architecture

```
epihack/
├── backend/                  FastAPI REST API
│   └── app/
│       ├── main.py           CORS, middleware, router wiring
│       ├── config.py         Pydantic settings
│       ├── models/           Domain enums
│       ├── schemas/          Pydantic request/response schemas
│       ├── routers/          auth · surveys · responses · alerts · dashboard
│       └── utils/            Cognito auth, DynamoDB client, S3 helpers
│
├── frontend/                 React + Vite SPA
│   └── src/
│       ├── App.jsx           Router + protected routes
│       ├── context/          AuthContext (Cognito session)
│       ├── hooks/            useFetch, useMutation, domain hooks
│       ├── services/         axios API client with interceptors
│       ├── pages/            Dashboard · Surveys · Alerts · My Responses
│       └── components/       AppLayout + design system CSS
│
└── docker-compose.yml        Full stack orchestration
```

---

## Quick Start

### 1. Environment Variables

Copy the example and fill in credentials (find in Discord):

```bash
cp backend/.env.example .env        # backend — goes in project root
cp frontend/.env.example frontend/web/.env  # frontend
```

### 2a. Option A — Docker (recommended)

```bash
docker-compose up --build
```

| Service  | URL                        |
| -------- | -------------------------- |
| Frontend | http://localhost:5173      |
| API docs | http://localhost:8000/docs |

### 2b. Option B — Local development

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

---

## API Overview

### Authentication

Using AWS Cognito

### Database

Using AWS DynamoDB

| Method | Endpoint                | Description              |
| ------ | ----------------------- | ------------------------ |
| POST   | /api/auth/register      | Create account           |
| POST   | /api/auth/login         | Get JWT token            |
| GET    | /api/surveys            | List active surveys      |
| POST   | /api/surveys            | Create survey (analyst+) |
| POST   | /api/responses          | Submit survey response   |
| GET    | /api/alerts             | List alerts (filterable) |
| PATCH  | /api/alerts/{id}/status | Update alert status      |
| GET    | /api/dashboard/stats    | Aggregate stats          |
| GET    | /api/dashboard/trend    | Daily response trend     |

Full interactive docs: **http://localhost:8000/docs**

---

## User Roles & Permissions

| Role             | Submit Responses | Create Surveys | Manage Alerts |
| ---------------- | :--------------: | :------------: | :-----------: |
| `citizen`        |        ✅        |       ❌       |      ❌       |
| `health_worker`  |        ✅        |       ✅       |      ❌       |
| `veterinarian`   |        ✅        |       ✅       |      ❌       |
| `epidemiologist` |        ✅        |       ✅       |      ✅       |
| `admin`          |        ✅        |       ✅       |      ✅       |

---

## One Health Survey Categories

| Category      | Signal Domain                    |
| ------------- | -------------------------------- |
| `human`       | Fever, respiratory symptoms, GI  |
| `animal`      | Livestock / wildlife morbidity   |
| `environment` | Water quality, soil, air anomaly |
| `vector`      | Mosquito, tick, rodent density   |

---

## Roadmap

- [ ] Geospatial clustering (PostGIS / MongoDB $geoNear)
- [ ] WebSocket real-time alert push
- [ ] Mobile-first PWA survey mode (offline capable)
- [ ] EWMA + CUSUM time-series models
- [ ] WHO IHR-compliant alert export
- [ ] Multi-language survey support (i18n)
