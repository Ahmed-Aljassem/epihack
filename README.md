# 🦠 EpiRadar — Participatory Epidemic Surveillance System

A **One Health** early-warning platform that collects participatory survey data
across **human**, **animal**, and **environmental** domains, then applies
automated anomaly detection to flag potential epidemic or pandemic signals.

---

**Backend**
```bash
cd backend
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

Details to be added for below:

### Authentication

Using AWS Cognito

### Database

Using AWS DynamoDB


| Method | Endpoint                        | Description                   |
|--------|---------------------------------|-------------------------------|
| POST   | /api/auth/register              | Create account                |
| POST   | /api/auth/login                 | Get JWT token                 |
| GET    | /api/surveys                    | List active surveys           |
| POST   | /api/surveys                    | Create survey (analyst+)      |
| POST   | /api/responses                  | Submit survey response        |
| GET    | /api/alerts                     | List alerts (filterable)      |
| PATCH  | /api/alerts/{id}/status         | Update alert status           |
| GET    | /api/dashboard/stats            | Aggregate stats               |
| GET    | /api/dashboard/trend            | Daily response trend          |

Full interactive docs: **http://localhost:8000/docs**

---

## User Roles & Permissions

| Role             | Submit Responses | Create Surveys | Manage Alerts |
|------------------|:---:|:---:|:---:|
| `citizen`        | ✅  | ❌  | ❌  |
| `health_worker`  | ✅  | ✅  | ❌  |
| `veterinarian`   | ✅  | ✅  | ❌  |
| `epidemiologist` | ✅  | ✅  | ✅  |
| `admin`          | ✅  | ✅  | ✅  |

---

## Anomaly Detection

The background service (`app/services/anomaly_detector.py`) runs every **15 minutes**:

1. Fetches all active surveys
2. Buckets responses by day over a **14-day window**
3. Computes rolling mean + std deviation
4. Flags today's count if it exceeds **Z > 2.5σ**
5. Auto-creates an alert (severity scales with Z-score) if no open alert exists

Tune via env vars:
```
ALERT_SCAN_INTERVAL_MINUTES=15
ALERT_ANOMALY_Z_SCORE=2.5
```

---

## One Health Survey Categories

| Category      | Signal Domain                    |
|---------------|----------------------------------|
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
