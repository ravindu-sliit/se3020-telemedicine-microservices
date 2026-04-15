# Developer Guide

This guide explains how the system is implemented and how to run it in both Kubernetes and local development modes.

## 1. System Overview

The platform is split into a React frontend and independent Node.js microservices.

- frontend: React client app
- auth-service: user registration/login and JWT issuance
- patient-service: patient profiles and medical reports
- ai-symptom-checker: symptom triage suggestions
- payment-service: Stripe or mock payment checkout
- notification-service: email notifications (SMS path currently disabled)

## 2. Current Architecture

```mermaid
flowchart LR
  User[User Browser] --> FE[Frontend React App]

  FE -->|/api/auth| Auth[auth-service :5001]
  FE -->|/api/patients| Patient[patient-service :5002]
  FE -->|/api/ai| AI[ai-symptom-checker :5005]
  FE -->|/api/payments| Pay[payment-service :5006]
  FE -->|/api/notifications| Notify[notification-service :5007]

  Auth --> Mongo[(MongoDB)]
  Patient --> Mongo
```

Implementation references:

- Frontend API base URLs are in `frontend/src/services/api.js`.
- Runtime-injected frontend config is in `frontend/docker-entrypoint.sh`.
- Kubernetes ingress routing is in `k8s/ingress.yaml`.

## 3. Service Map

| Service | Folder | Default Port | Key Endpoints |
|---|---|---:|---|
| Frontend | `frontend` | 3000 (local), 80 (container) | `/` |
| Auth | `services/auth-service` | 5001 | `/api/auth/register`, `/api/auth/login`, `/api/auth/me` |
| Patient | `services/patient-service` | 5002 | `/api/patients/*` |
| AI Symptom Checker | `services/ai-symptom-checker` | 5005 | `/api/ai/check-symptoms`, `/api/health` |
| Payment | `services/payment-service` | 5006 | `/api/payments/checkout`, `/api/health` |
| Notification | `services/notification-service` | 5007 | `/api/notifications/send`, `/api/notifications/health` |

## 4. Kubernetes Deployment (Project Default)

### 4.1 Prerequisites

- Docker Desktop installed
- Kubernetes enabled in Docker Desktop
- `kubectl` installed and working
- Active context set to `docker-desktop`

Useful checks:

```powershell
kubectl config current-context
kubectl get nodes
```

### 4.2 Build Docker images used by manifests

Run from repository root:

```powershell
docker build -t frontend-image:latest ./frontend
docker build -t ai-symptom-checker-image:latest ./services/ai-symptom-checker
docker build -t auth-service-image:latest ./services/auth-service
docker build -t payment-service-image:latest ./services/payment-service
docker build -t notification-service-image:latest ./services/notification-service
docker build -t patient-service-image:latest ./services/patient-service
```

Notes:

- Kubernetes manifests use `imagePullPolicy: Never`, so local images must exist in Docker Desktop.
- Auth and patient services are now deployed via `k8s/auth-deployment.yaml` and `k8s/patient-deployment.yaml`.

### 4.3 Configure secrets

1. Create secret manifest from template:

```powershell
Copy-Item .\k8s\auth-secret.example.yaml .\k8s\auth-secret.yaml
Copy-Item .\k8s\patient-secret.example.yaml .\k8s\patient-secret.yaml
Copy-Item .\k8s\payment-secret.example.yaml .\k8s\payment-secret.yaml
```

2. Edit all created secret files and set real values.
3. Apply secrets:

```powershell
kubectl apply -f .\k8s\auth-secret.yaml
kubectl apply -f .\k8s\patient-secret.yaml
kubectl apply -f .\k8s\payment-secret.yaml
```

### 4.4 Apply Kubernetes manifests

```powershell
Get-ChildItem .\k8s\*.yaml |
  Where-Object { $_.Name -notin @('auth-secret.example.yaml', 'patient-secret.example.yaml', 'payment-secret.example.yaml') } |
  ForEach-Object { kubectl apply -f $_.FullName }
```

### 4.5 Access through ingress

1. Add host mapping:

- `127.0.0.1 smart-healthcare.local`

2. Open:

- `http://smart-healthcare.local`

Current ingress paths in `k8s/ingress.yaml`:

- `/` -> frontend-service (80)
- `/api/auth` -> auth-service (5001)
- `/api/patients` -> patient-service (5002)
- `/api/ai` -> ai-symptom-checker-service (5005)
- `/api/payments` -> payment-service (5006)
- `/api/notifications` -> notification-service (5007)

### 4.6 Verify deployment

```powershell
kubectl get deployments
kubectl get pods -o wide
kubectl get svc
kubectl get ingress
```

Optional: skip patient-service while continuing with the rest:

```powershell
kubectl scale deployment patient-service --replicas=0
```

## 5. Local Development Run (All Services)

Use this mode when you need full auth + patient functionality and direct service debugging.

### 5.1 Frontend

```powershell
cd frontend
npm install
npm start
```

Frontend defaults in `frontend/src/services/api.js`:

- auth: `http://localhost:5001/api`
- patient: `http://localhost:5002/api`
- ai: `http://localhost:5005/api`
- payment: `http://localhost:5006/api`
- notification: `http://localhost:5007/api`

### 5.2 Backend services

For each service below, open a separate terminal, create a `.env` file if needed, and run `npm install` then `npm start`.

#### auth-service (`services/auth-service`)

Required environment variables:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- optional `PORT` (default `5001`)

#### patient-service (`services/patient-service`)

Required environment variables:

- `MONGODB_URI`
- `JWT_SECRET`
- optional `PORT` (default `5002`)

#### ai-symptom-checker (`services/ai-symptom-checker`)

Optional environment variables:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default `gemini-2.0-flash`)
- optional `PORT` (default `5005`)

If `GEMINI_API_KEY` is missing/invalid, service runs in fallback recommendation mode.

#### payment-service (`services/payment-service`)

Optional environment variables:

- `STRIPE_SECRET_KEY`
- `PAYMENT_MOCK_ONLY` (`true` or `false`)
- `FRONTEND_BASE_URL`
- `PAYMENT_SUCCESS_URL`
- `PAYMENT_CANCEL_URL`
- optional `PORT` (default `5006`)

Without `STRIPE_SECRET_KEY`, checkout works in mock mode.

#### notification-service (`services/notification-service`)

Optional environment variables:

- `EMAIL_USER`
- `EMAIL_APP_PASSWORD`
- `EMAIL_SEND_TIMEOUT_MS`
- optional `PORT` (default `5007`)

Without email credentials, notification requests are handled in mock/degraded mode.

## 6. Known Gaps and Important Notes

- Some manifests include hardcoded sample secrets/keys. Move real secrets to secure secret management before production use.

## 7. Troubleshooting

### Kubernetes API not reachable

Symptom:

- `kubectl apply` fails with connect errors to `127.0.0.1:6443`

Fix:

- Start Kubernetes in Docker Desktop and wait until status is Running.
- Re-run `kubectl get nodes`.

### ImagePullBackOff

Symptom:

- Pod stuck in `ImagePullBackOff`

Fix:

- Build the missing image with the exact image tag expected in the deployment.
- Re-apply deployment or delete failing pod.

### Frontend reachable but API calls fail

Fix checklist:

- Confirm frontend runtime env vars (`frontend/docker-entrypoint.sh` values).
- Confirm ingress path exists for target API.
- Confirm backend pod is Running and service is present.

## 8. Suggested Next Improvements

- Add k8s deployment/service/ingress for auth-service and patient-service.
- Add `.env.example` files to each service.
- Add one root script (or Makefile) to build images and apply manifests in one command.
- Move credentials out of manifests into proper Kubernetes Secrets only.
