# se3020-telemedicine-microservices

Smart Healthcare platform built with a React frontend and Node.js microservices.

This repository now includes a full developer runbook and architecture guide so new contributors can quickly understand implementation details and run the system.

## Developer Documentation

- Full implementation and run guide: [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
- Postman collection: [postman/telemedicine-services.postman_collection.json](postman/telemedicine-services.postman_collection.json)

## Quick Start (Kubernetes)

Prerequisites:

- Docker Desktop with Kubernetes enabled
- kubectl configured to docker-desktop context

From the repository root, build images used by the manifests:

```powershell
docker build -t frontend-image:latest ./frontend
docker build -t ai-symptom-checker-image:latest ./services/ai-symptom-checker
docker build -t auth-service-image:latest ./services/auth-service
docker build -t payment-service-image:latest ./services/payment-service
docker build -t notification-service-image:latest ./services/notification-service
docker build -t patient-service-image:latest ./services/patient-service
```

Create the payment secret from the template and apply manifests:

```powershell
Copy-Item .\k8s\auth-secret.example.yaml .\k8s\auth-secret.yaml
Copy-Item .\k8s\patient-secret.example.yaml .\k8s\patient-secret.yaml
Copy-Item .\k8s\payment-secret.example.yaml .\k8s\payment-secret.yaml
# Edit secret files and set real values before applying

kubectl apply -f .\k8s\auth-secret.yaml
kubectl apply -f .\k8s\patient-secret.yaml
kubectl apply -f .\k8s\payment-secret.yaml
Get-ChildItem .\k8s\*.yaml |
  Where-Object { $_.Name -notin @('auth-secret.example.yaml', 'patient-secret.example.yaml', 'payment-secret.example.yaml') } |
  ForEach-Object { kubectl apply -f $_.FullName }
```

Open the app:

1. Add `127.0.0.1 smart-healthcare.local` to your hosts file.
2. Browse to `http://smart-healthcare.local`.

If patient-service image or dependencies are not ready yet, temporarily skip it:

```powershell
kubectl scale deployment patient-service --replicas=0
```

## Quick Start (Local Development)

Run frontend:

```powershell
cd frontend
npm install
npm start
```

Then run required services in separate terminals from each service folder:

```powershell
npm install
npm start
```

The complete local environment variables and service startup details are documented in [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md).

## Member 1 Scope (Auth + Patient Security)

- JWT-based auth flow with token verification in auth-service and patient-service.
- RBAC roles: patient, doctor, admin.
- Patient profile and medical report ownership checks.
- Medical report upload validation (type and file size constraints).
