# se3020-telemedicine-microservices

Smart healthcare platform with a React frontend and Node.js microservices.

## What This Repo Includes

- Frontend UI for authentication and patient profile management
- Backend microservices (auth, patient, doctor, AI symptom checker, payment, notification)
- Kubernetes manifests for local cluster deployment
- Postman collection and environments for API verification

## Developer Docs

- Detailed guide: [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
- API tests collection: [postman/telemedicine-services.postman_collection.json](postman/telemedicine-services.postman_collection.json)
- Postman local env: [postman/telemedicine-local.postman_environment.json](postman/telemedicine-local.postman_environment.json)
- Postman k8s env: [postman/telemedicine-k8s.postman_environment.json](postman/telemedicine-k8s.postman_environment.json)

## Implemented Features

### Frontend

- Auth routes: `/login`, `/register`
- Patient routes: `/patient`, `/patient/profile`, `/patient/symptom-checker`, `/patient/book-appointment`
- Session-aware navbar (sign in/register/logout)
- Runtime API configuration via `window.__APP_CONFIG__`

### APIs Wired From Frontend

- Auth API: `/api/auth/*`
- Patient API: `/api/patients/*`
- AI API: `/api/ai/*`
- Payment API: `/api/payments/*`
- Notification API: `/api/notifications/*`
- Doctor API: `/api/doctors/*`

### Kubernetes

Deployments and services are included for:

- frontend
- auth-service
- patient-service
- doctor-service
- ai-symptom-checker
- payment-service
- notification-service

Ingress host: `smart-healthcare.local`

## Project Structure

- `frontend/`: React client
- `services/`: Node.js microservices
- `k8s/`: Kubernetes manifests
- `postman/`: API testing collection and environments

## Quick Start (Kubernetes)

### 1. Prerequisites

- Docker Desktop with Kubernetes enabled
- kubectl configured to `docker-desktop`

### 2. Build images

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

### 3. Configure secrets

Create secret files from templates:

```powershell
Copy-Item .\k8s\auth-secret.example.yaml .\k8s\auth-secret.yaml
Copy-Item .\k8s\patient-secret.example.yaml .\k8s\patient-secret.yaml
Copy-Item .\k8s\doctor-secret.example.yaml .\k8s\doctor-secret.yaml
Copy-Item .\k8s\payment-secret.example.yaml .\k8s\payment-secret.yaml
```

Fill real values, then apply:

```powershell
kubectl apply -f .\k8s\auth-secret.yaml
kubectl apply -f .\k8s\patient-secret.yaml
kubectl apply -f .\k8s\doctor-secret.yaml
kubectl apply -f .\k8s\payment-secret.yaml
```

### 4. Apply manifests

```powershell
Get-ChildItem .\k8s\*.yaml |
   Where-Object { $_.Name -notin @('auth-secret.example.yaml', 'patient-secret.example.yaml', 'doctor-secret.example.yaml', 'payment-secret.example.yaml') } |
  ForEach-Object { kubectl apply -f $_.FullName }
```

### 5. Access app

- Add host mapping: `127.0.0.1 smart-healthcare.local`
- Open: `http://smart-healthcare.local`

### 6. Verify deployment

```powershell
kubectl get deployments
kubectl get pods -o wide
kubectl get svc
kubectl get ingress
```

## Quick Start (Local Frontend + Local APIs)

```powershell
cd frontend
npm install
npm start
```

Default API targets in frontend service layer:

- auth: `http://localhost:5001/api`
- patient: `http://localhost:5002/api`
- doctor: `http://localhost:5002/api`
- ai: `http://localhost:5005/api`
- payment: `http://localhost:5006/api`
- notification: `http://localhost:5007/api`

## Postman Testing

1. Import collection: [postman/telemedicine-services.postman_collection.json](postman/telemedicine-services.postman_collection.json)
2. Select environment:
   - local: [postman/telemedicine-local.postman_environment.json](postman/telemedicine-local.postman_environment.json)
   - kubernetes: [postman/telemedicine-k8s.postman_environment.json](postman/telemedicine-k8s.postman_environment.json)
3. Recommended run order:
   - Register Patient
   - Login Patient
   - Get Current User
   - Create Patient Profile
   - Get Patient Profile
   - Update Patient Profile

## Notes

- `.env` files are ignored and should remain local.
- Use secret templates for onboarding.
- Never commit real credentials.
- Doctor-service uses port `5002` as requested; if you publish patient-service locally on the same host port, remap one of them to avoid a collision.
