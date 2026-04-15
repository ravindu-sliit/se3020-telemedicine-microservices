# Developer Guide

This document explains how the system is implemented and how to run and validate it.

## 1. Architecture Overview

The platform is built as a frontend plus independent backend microservices.

### Frontend

- Stack: React (`frontend/`)
- Runtime API config is injected at container startup (`frontend/docker-entrypoint.sh`)
- API client layer is in `frontend/src/services/api.js`

### Backend services

- auth-service (`services/auth-service`) - registration, login, current user, JWT
- patient-service (`services/patient-service`) - profile create/read/update, report APIs
- ai-symptom-checker (`services/ai-symptom-checker`) - symptom triage endpoint
- payment-service (`services/payment-service`) - checkout session creation
- notification-service (`services/notification-service`) - email notification endpoint

## 2. Frontend UI and API Wiring

### Routes currently enabled

- `/` landing page
- `/login` sign-in page
- `/register` registration page
- `/patient` patient dashboard
- `/patient/profile` patient profile form
- `/patient/symptom-checker` AI symptom checker page
- `/patient/book-appointment` appointment page
- `/doctor` doctor page
- `/admin` admin page

### Frontend API base keys

Read in `frontend/src/services/api.js` using runtime-config helper:

- `REACT_APP_AUTH_API_URL`
- `REACT_APP_PATIENT_API_URL`
- `REACT_APP_AI_API_URL`
- `REACT_APP_PAYMENT_API_URL`
- `REACT_APP_NOTIFICATION_API_URL`

Kubernetes frontend deployment sets all of these to:

- `http://smart-healthcare.local/api`

So requests become:

- auth: `/api/auth/*`
- patient: `/api/patients/*`
- ai: `/api/ai/*`
- payments: `/api/payments/*`
- notifications: `/api/notifications/*`

## 3. Kubernetes Setup

## 3.1 Prerequisites

- Docker Desktop running
- Kubernetes enabled in Docker Desktop
- `kubectl` installed
- context is `docker-desktop`

Verify:

```powershell
kubectl config current-context
kubectl get nodes
```

## 3.2 Build images

From repository root:

```powershell
docker build -t frontend-image:latest .\frontend
docker build -t ai-symptom-checker-image:latest .\services\ai-symptom-checker
docker build -t auth-service-image:latest .\services\auth-service
docker build -t patient-service-image:latest .\services\patient-service
docker build -t payment-service-image:latest .\services\payment-service
docker build -t notification-service-image:latest .\services\notification-service
```

## 3.3 Configure and apply secrets

```powershell
Copy-Item .\k8s\auth-secret.example.yaml .\k8s\auth-secret.yaml
Copy-Item .\k8s\patient-secret.example.yaml .\k8s\patient-secret.yaml
Copy-Item .\k8s\payment-secret.example.yaml .\k8s\payment-secret.yaml
```

Fill each file with real values, then apply:

```powershell
kubectl apply -f .\k8s\auth-secret.yaml
kubectl apply -f .\k8s\patient-secret.yaml
kubectl apply -f .\k8s\payment-secret.yaml
```

## 3.4 Apply all manifests

```powershell
Get-ChildItem .\k8s\*.yaml |
  Where-Object { $_.Name -notin @('auth-secret.example.yaml', 'patient-secret.example.yaml', 'payment-secret.example.yaml') } |
  ForEach-Object { kubectl apply -f $_.FullName }
```

## 3.5 Ingress and access

Ingress host:

- `smart-healthcare.local`

Add host mapping locally:

- `127.0.0.1 smart-healthcare.local`

Open app:

- `http://smart-healthcare.local`

## 3.6 Verify deployment health

```powershell
kubectl get deployments
kubectl get pods -o wide
kubectl get svc
kubectl get ingress
```

Expected:

- all deployments `READY 1/1`
- all relevant pods `Running`

## 4. Postman API Verification

Artifacts:

- collection: `postman/telemedicine-services.postman_collection.json`
- local env: `postman/telemedicine-local.postman_environment.json`
- k8s env: `postman/telemedicine-k8s.postman_environment.json`

### Key variables used

- `auth_base_url`
- `patient_base_url`
- `ai_base_url`
- `payment_base_url`
- `notification_base_url`
- `auth_token`
- `auth_user_id`

### Recommended smoke sequence

1. Register Patient
2. Login Patient
3. Get Current User
4. Create Patient Profile
5. Get Patient Profile
6. Update Patient Profile

## 5. Core Kubernetes Files

- `k8s/frontend-deployment.yaml` - frontend deployment + runtime API env vars
- `k8s/ingress.yaml` - all API and frontend path routing
- `k8s/auth-deployment.yaml` - auth pod config
- `k8s/auth-service.yaml` - auth cluster service
- `k8s/patient-deployment.yaml` - patient pod config
- `k8s/patient-service.yaml` - patient cluster service
- `k8s/auth-secret.example.yaml` - auth secret template
- `k8s/patient-secret.example.yaml` - patient secret template
- `k8s/payment-secret.example.yaml` - payment secret template

## 6. Security and Collaboration Notes

- Never commit real secret values.
- Keep `.env` local only.
- Keep secret templates in Git and real secret files out of Git.
- Use Postman environment files for shared testing setup.

## 7. Troubleshooting

### Frontend still showing old version

- Rebuild image: `docker build -t frontend-image:latest .\frontend`
- Restart deployment: `kubectl rollout restart deployment/frontend-deployment`
- Wait for rollout: `kubectl rollout status deployment/frontend-deployment`
- Hard refresh browser (`Ctrl+F5`)

### Kubernetes apply fails with localhost:6443 connection error

- Docker Desktop Kubernetes is not ready.
- Wait until Kubernetes status is running, then retry.

### Auth or Patient requests fail with 401

- Ensure JWT secret matches where needed.
- Re-login to refresh token in frontend/postman.

### Auth or Patient fails to start in cluster

- Check secret exists: `kubectl get secret auth-service-secrets patient-service-secrets`
- Check logs:

```powershell
kubectl logs deployment/auth-service-deployment
kubectl logs deployment/patient-service
```
