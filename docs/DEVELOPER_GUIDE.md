# Developer Guide

This guide explains implementation details and how to run and validate the system.

## 1. Architecture Overview

The platform has a React frontend and independent Node.js microservices.

### Frontend

- Stack: React (`frontend/`)
- Runtime API config injection: `frontend/docker-entrypoint.sh`
- API client layer: `frontend/src/services/api.js`

### Backend services

- auth-service (`services/auth-service`): registration, login, current user, JWT
- patient-service (`services/patient-service`): profile create/read/update, report APIs
- doctor-service (`services/doctor-service`): doctor application submission and review
- ai-symptom-checker (`services/ai-symptom-checker`): symptom triage endpoint
- payment-service (`services/payment-service`): checkout session creation
- notification-service (`services/notification-service`): email notification endpoint

## 2. Frontend Routes and API Wiring

### Routes currently enabled

- `/`
- `/login`
- `/register`
- `/patient`
- `/patient/profile`
- `/patient/symptom-checker`
- `/patient/book-appointment`
- `/doctor`
- `/admin`

### Frontend API base environment keys

Configured in `frontend/src/services/api.js`:

- `REACT_APP_AUTH_API_URL`
- `REACT_APP_PATIENT_API_URL`
- `REACT_APP_AI_API_URL`
- `REACT_APP_PAYMENT_API_URL`
- `REACT_APP_NOTIFICATION_API_URL`

Kubernetes frontend deployment sets these to `http://smart-healthcare.local/api`, so requests become:

- auth: `/api/auth/*`
- patient: `/api/patients/*`
- doctor: `/api/doctors/*`
- ai: `/api/ai/*`
- payments: `/api/payments/*`
- notifications: `/api/notifications/*`

## 3. Kubernetes Deployment

### 3.1 Prerequisites

- Docker Desktop running
- Kubernetes enabled in Docker Desktop
- `kubectl` installed
- Active context: `docker-desktop`

Verify:

```powershell
kubectl config current-context
kubectl get nodes
```

### 3.2 Build images

From repository root:

```powershell
docker build -t frontend-image:latest .\frontend
docker build -t ai-symptom-checker-image:latest .\services\ai-symptom-checker
docker build -t auth-service-image:latest .\services\auth-service
docker build -t patient-service-image:latest .\services\patient-service
docker build -t doctor-service-image:latest .\services\doctor-service
docker build -t payment-service-image:latest .\services\payment-service
docker build -t notification-service-image:latest .\services\notification-service
```

### 3.3 Configure and apply secrets

Create files from templates:

```powershell
Copy-Item .\k8s\auth-secret.example.yaml .\k8s\auth-secret.yaml
Copy-Item .\k8s\patient-secret.example.yaml .\k8s\patient-secret.yaml
Copy-Item .\k8s\doctor-secret.example.yaml .\k8s\doctor-secret.yaml
Copy-Item .\k8s\appointment-secret.example.yaml .\k8s\appointment-secret.yaml
Copy-Item .\k8s\payment-secret.example.yaml .\k8s\payment-secret.yaml
Copy-Item .\k8s\notification-secret.example.yaml .\k8s\notification-secret.yaml
```

Fill real values, then apply:

```powershell
kubectl apply -f .\k8s\auth-secret.yaml
kubectl apply -f .\k8s\patient-secret.yaml
kubectl apply -f .\k8s\doctor-secret.yaml
kubectl apply -f .\k8s\appointment-secret.yaml
kubectl apply -f .\k8s\payment-secret.yaml
kubectl apply -f .\k8s\notification-secret.yaml
```

Recommended for team onboarding (single command):

1. Set required env vars in your local terminal session:

```powershell
$env:AUTH_MONGODB_URI="<auth mongodb uri>"
$env:PATIENT_MONGODB_URI="<patient mongodb uri>"
$env:DOCTOR_MONGO_URI="<doctor mongodb uri>"
$env:APPOINTMENT_MONGODB_URI="<appointment mongodb uri>"
$env:JWT_SECRET="<shared jwt secret>"
$env:STRIPE_SECRET_KEY="<stripe secret key>"
$env:EMAIL_USER="<sender email>"
$env:EMAIL_APP_PASSWORD="<email app password>"
# Optional:
$env:JWT_EXPIRES_IN="7d"
$env:EMAIL_PROVIDER="auto"
$env:EMAIL_FROM="<sender email>"
$env:SENDGRID_API_KEY="<sendgrid key>"
```

2. Run:

```powershell
.\scripts\apply-k8s-secrets.ps1
```

This keeps real secrets out of tracked YAML files while allowing every developer to deploy quickly.

### 3.4 Apply manifests

```powershell
Get-ChildItem .\k8s\*.yaml |
  Where-Object { $_.Name -notin @('auth-secret.example.yaml', 'patient-secret.example.yaml', 'payment-secret.example.yaml') } |
  ForEach-Object { kubectl apply -f $_.FullName }
```

If you also use the doctor secret template, exclude it the same way when applying all manifests.

### 3.5 Access through ingress

- Ingress host: `smart-healthcare.local`
- Add host mapping: `127.0.0.1 smart-healthcare.local`
- Open: `http://smart-healthcare.local`

Current ingress paths in `k8s/ingress.yaml`:

- `/` -> frontend-service
- `/api/auth` -> auth-service
- `/api/doctors` -> doctor-service
- `/api/patients` -> patient-service
- `/api/ai` -> ai-symptom-checker-service
- `/api/payments` -> payment-service
- `/api/notifications` -> notification-service

### 3.6 Verify deployment health

```powershell
kubectl get deployments
kubectl get pods -o wide
kubectl get svc
kubectl get ingress
```

Expected:

- Deployments are ready (`1/1`)
- Relevant pods are `Running`

## 4. Postman Verification

Artifacts:

- Collection: `postman/telemedicine-services.postman_collection.json`
- Local env: `postman/telemedicine-local.postman_environment.json`
- Kubernetes env: `postman/telemedicine-k8s.postman_environment.json`

### Recommended smoke sequence

1. Register Patient
2. Login Patient
3. Get Current User
4. Create Patient Profile
5. Get Patient Profile
6. Update Patient Profile

## 5. Core Kubernetes Files

- `k8s/frontend-deployment.yaml`
- `k8s/ingress.yaml`
- `k8s/auth-deployment.yaml`
- `k8s/auth-service.yaml`
- `k8s/doctor-deployment.yaml`
- `k8s/doctor-service.yaml`
- `k8s/patient-deployment.yaml`
- `k8s/patient-service.yaml`
- `k8s/auth-secret.example.yaml`
- `k8s/doctor-secret.example.yaml`
- `k8s/doctor-secret.yaml`
- `k8s/patient-secret.example.yaml`
- `k8s/appointment-secret.example.yaml`
- `k8s/payment-secret.example.yaml`
- `k8s/notification-secret.example.yaml`

## 6. Security Notes

- Never commit real secret values.
- Keep `.env` files local only.
- Keep only secret templates in Git.

## 7. Troubleshooting

### Frontend still shows old version

```powershell
docker build -t frontend-image:latest .\frontend
kubectl rollout restart deployment/frontend-deployment
kubectl rollout status deployment/frontend-deployment
```

Then hard-refresh the browser (`Ctrl+F5`).

### Kubernetes API connection error (`127.0.0.1:6443`)

- Ensure Docker Desktop Kubernetes is running.
- Retry once nodes are ready.

### Auth or patient returns 401

- Verify JWT secrets are correct and aligned across services.
- Log in again to refresh the token.

### Auth or patient fails to start

```powershell
kubectl get secret auth-service-secrets patient-service-secrets
kubectl logs deployment/auth-service-deployment
kubectl logs deployment/patient-service
```

Optional temporary workaround:

```powershell
kubectl scale deployment patient-service --replicas=0
```

### Doctor service

- Doctor service listens on port `5003`.
- Doctor service reads `MONGO_URI` and shares the auth JWT secret through `auth-service-secrets`.
