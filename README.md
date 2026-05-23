# 🦠 EpiHack — One Health Epidemiology Platform

EpiHack is a monorepo for a production-grade epidemiology mapping system focused on **Human, Animal, and Environmental** signal fusion.
The platform combines a FastAPI backend microservice with a full-featured React/Vite desktop SPA and a React Native/Expo mobile application.

## What this repo contains

- `backend/`
  - FastAPI microservice with Pydantic validation, AWS Cognito authentication, DynamoDB document ingestion, and S3 multipart image uploads.
- `frontend/`
  - `web/`: React + Vite desktop SPA using AWS Amplify OIDC session management.
  - `onehealth-mobile/`: Expo-based React Native TypeScript mobile app with modular report tracking blocks.
- `docker-compose.yml`
  - Local orchestration for backend and frontend services.

## System architecture

This repository implements a One Health epidemiology stack that maps signals across three domains:

- **Human**: symptoms, personal exposure, clinical observations
- **Animal**: livestock, wildlife sickness, zoonotic vectors
- **Environmental**: water quality, air, soil and vector habitat observations

Each report is modeled as a composite JSON payload with dedicated sub-reports and optional binary image streams.
Images are streamed concurrently via multipart/form-data and persisted to AWS S3, while the validated survey document is injected into DynamoDB.

               +---------------------------+
               |  Mobile App (Expo/TS)     |
               |  Desktop Web (React/Vite) |
               +-------------+-------------+
                             |
                    (Multipart Payload)
                             v
               +---------------------------+
               |    FastAPI Microservice   |
               | (Pydantic payload check)  |
               +-------------+-------------+
                             |
              +--------------+--------------+
              |                             |
     (Binary Image Streams)       (Validated Metadata JSON)
              v                             v
+---------------------------+ +---------------------------+
|      Amazon S3 Bucket     | |     Amazon DynamoDB       |
|    (Image Asset Hosting)  | |  (NoSQL Document Store)   |
+---------------------------+ +---------------------------+

---

## Backend architecture

### Core technologies

- FastAPI
- Pydantic v2
- Uvicorn
- boto3 for AWS S3 and DynamoDB
- python-multipart for multipart/form-data handling
- AWS Cognito / OIDC for authentication

### Key responsibilities

- **Pydantic data validation** for request payloads and application settings.
- **Multipart/form-data handling** for concurrent image uploads in `animal_images`, `human_images`, and `environment_images`.
- **S3 binary storage** for report images, using an async upload helper that streams file bytes directly to S3.
- **DynamoDB document injection** for domain-rich survey records, preserving nested One Health JSON.
- **Cognito-backed auth** to secure API routes and protect epidemiology data.

### Backend structure

- `backend/app/main.py`
  - FastAPI app creation, CORS, router integration, auth dependencies.
- `backend/app/config.py`
  - Pydantic settings for AWS credentials, Cognito, S3, and DynamoDB configuration.
- `backend/app/schemas/schemas.py`
  - Request and response models for surveys, responses, and user operations.
- `backend/app/routers/`
  - `auth.py` — Cognito sign-up, sign-in, confirm, and token validation.
  - `surveys.py` — survey definitions and active survey queries.
  - `responses.py` — One Health report ingestion and image handling.
  - `dashboard.py` — aggregate metrics, trend reports, and alert counts.
- `backend/app/utils/`
  - `auth.py` — token verification and user identity resolution.
  - `dynamo.py` — DynamoDB client and document operations.
  - `s3.py` — upload helpers for binary image streams.

### One Health report flow

1. Client submits a JSON payload describing one or more sub-reports.
2. Client attaches images as multipart file streams grouped by domain:
   - `human_images`
   - `animal_images`
   - `environment_images`
3. Backend validates the payload with Pydantic and uploads each image to S3.
4. S3 URLs are appended to the matching sub-report sections.
5. The complete enriched document is written to DynamoDB for analytics and alerting.

---

## Frontend architecture

### Desktop SPA (`frontend/web`)

- **React + Vite**
- **AWS Amplify** for OIDC session management and user flows
- **Axios** for API communication
- **React Router Dom** for client routing
- **Recharts** for dashboard visualizations
- **React Hook Form** for data-driven forms

The desktop app is a secure epidemiology operations console for analysts and surveillance teams.
It supports login, survey management, response review, and One Health dashboard exploration.

### Mobile app (`frontend/onehealth-mobile`)

- **Expo** with React Native and TypeScript
- **Expo Router** for modular navigation
- **React Native Image Picker** and S3-friendly image handling
- **AsyncStorage** for local persistence
- **Location / sensors** for environmental context capture

The mobile app is designed for field reporting with modular blocks for:

- human health observations
- animal health observations
- environmental measurements
- evidence capture through photos and location metadata

These report tracking blocks map directly to the backend One Health ingest model.

---

## Deployment and development

### Install all dependencies

```bash
npm install
npm run install:all
```

### Run locally

```bash
npm run dev
```

This command starts:

- Backend: `uvicorn app.main:app --reload --port 8000`
- Frontend: `vite` for the desktop SPA

### Docker

```bash
docker-compose up --build
```

### Backend manual startup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend desktop manual startup

```bash
cd frontend/web
npm install
npm run dev
```

### Mobile app manual startup

```bash
cd frontend/onehealth-mobile
npm install
npm run start
```

### Environment variables

Create a backend `.env` from the example and configure AWS/Cognito values.
The backend loads `backend/.env` using Pydantic settings.

---

## API summary

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| POST   | `/api/auth/login` | Sign in and receive tokens |
| POST   | `/api/auth/register` | Create a new account |
| POST   | `/api/auth/confirm` | Confirm new account registration |
| GET    | `/api/surveys/` | Retrieve active survey definitions |
| POST   | `/api/responses/` | Submit a structured survey response payload |
| POST   | `/survey/response` | Alternate authenticated survey response ingestion block |
| POST   | `/report` | Direct crowd-sourced field report ingestion (multipart/form-data with binary image streams) |
| GET    | `/api/dashboard/stats` | Load aggregated dashboard metrics |
| GET    | `/api/dashboard/trend` | Load chronological trend analysis metrics |
| GET    | `/health` | Core service health check and runtime state confirmation |

### Image upload contract

Send multipart/form-data to `/api/responses` with domain-specific file arrays:

- `human_images`
- `animal_images`
- `environment_images`

Each uploaded file is stored in S3 and associated with the corresponding sub-report.

---

## One Health domain mapping

This system is architected to support triad-level epidemiology mapping:

- **Human domain** — patient-reported symptoms, exposure histories, and clinical evidence.
- **Animal domain** — livestock morbidity, wildlife illness, and zoonotic risk factors.
- **Environmental domain** — water, air, soil, and habitat conditions.

Reports can include mixed-domain insights in a single payload, enabling composite risk signals and cross-domain analytics.

---

## Recommended production considerations

- Use managed AWS services for Cognito, S3, and DynamoDB.
- Secure all API routes with OIDC token verification.
- Enable HTTPS and strict CORS for the desktop SPA and mobile app.
- Use a global CDN or CloudFront distribution for static web assets.
- Monitor DynamoDB write throughput and S3 request volumes during high-volume reporting.

---

## Project contacts


- `backend/` — FastAPI service and data ingestion
- `frontend/web/` — React/Vite desktop analytics SPA
- `frontend/onehealth-mobile/` — Expo mobile reporting app
