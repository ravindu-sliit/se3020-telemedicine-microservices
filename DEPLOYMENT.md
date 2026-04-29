# AI-Enabled Smart Healthcare Platform - Deployment Instructions

**Project:** AI-Enabled Smart Healthcare Platform  
**Module:** SE3020 - Distributed Systems  
**Environment:** Local Kubernetes Cluster (Docker Desktop)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Configure Local DNS](#step-1-configure-local-dns)
3. [Step 2: Prepare Secrets](#step-2-prepare-secrets)
4. [Step 3: Build Docker Images](#step-3-build-docker-images)
5. [Step 4: Deploy to Kubernetes](#step-4-deploy-to-kubernetes)
6. [Step 5: Access the Platform](#step-5-access-the-platform)
7. [Step 6: Verify Deployment](#step-6-verify-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Post-Deployment Configuration](#post-deployment-configuration)

---

## Prerequisites

Ensure the following tools are installed and configured:

### Required Software
- **Docker Desktop** (v4.0 or later)
  - Download: https://www.docker.com/products/docker-desktop
  - Install and launch Docker Desktop
  
- **Kubernetes** (enabled in Docker Desktop)
  - Open Docker Desktop settings → Kubernetes tab
  - Check "Enable Kubernetes"
  - Wait for Kubernetes to fully start (status shows green checkmark)

- **kubectl** (Kubernetes command-line tool)
  - Comes bundled with Docker Desktop
  - Verify: `kubectl version --client`

- **Nginx Ingress Controller**
  - Install via Helm (recommended) or manual kubectl apply
  ```powershell
  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
  helm repo update
  helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace
  ```
  - Or apply pre-built manifests:
  ```powershell
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
  ```

### Verify Prerequisites
```powershell
# Check Docker Desktop is running
docker --version

# Check Kubernetes is enabled
kubectl get nodes

# Check Ingress Controller is running
kubectl get pods -n ingress-nginx
```

Expected output:
```
NAME             STATUS   ROLES    AGE   VERSION
docker-desktop   Ready    control-plane,worker   8h    v1.28.0
```

---

## Step 1: Configure Local DNS

To access the platform via `http://smart-healthcare.local`, add a local hosts entry:

### Windows

1. Open Notepad as Administrator
2. Open file: `C:\Windows\System32\drivers\etc\hosts`
3. Add this line at the end:
   ```
   127.0.0.1    smart-healthcare.local
   ```
4. Save and close

### Mac/Linux

1. Open terminal and edit the hosts file:
   ```bash
   sudo nano /etc/hosts
   ```
2. Add this line:
   ```
   127.0.0.1    smart-healthcare.local
   ```
3. Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### Verify

Test DNS resolution:
```powershell
# Windows
nslookup smart-healthcare.local

# Mac/Linux
nslookup smart-healthcare.local
```

Should resolve to `127.0.0.1`

---

## Step 2: Prepare Secrets

The platform requires sensitive credentials for databases, payment processing, and email services.

### Required Credentials

Gather the following information:

| Service | Credential | Example |
|---------|-----------|---------|
| **Auth Service** | MongoDB Connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/auth_db...` |
| **Patient Service** | MongoDB Connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/patient_db...` |
| **Doctor Service** | MongoDB Connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/doctor_db...` |
| **Appointment Service** | MongoDB Connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/appointment_db...` |
| **Telemedicine Service** | MongoDB Connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/telemedicine_db...` |
| **JWT Authentication** | Shared JWT Secret | Any long random string (e.g., `your-secret-key-here`) |
| **Payment Service** | Stripe Secret Key | `sk_test_51TMOFm...` |
| **Email Service** | Email User | `your_email@gmail.com` |
| **Email Service** | App Password (Gmail) | `xxxx xxxx xxxx xxxx` |
| **AI Service** | Gemini API Key | `AQ.Ab8RN6JLLpzlVMs...` |
| **Notifications** | SendGrid API Key | `SG.OHa2FoOtSVqViz...` |

### Set Environment Variables (PowerShell)

```powershell
# Core database credentials
$env:AUTH_MONGODB_URI="mongodb+srv://dbuser:password@cluster.mongodb.net/auth_db?retryWrites=true&w=majority&appName=Cluster0"
$env:PATIENT_MONGODB_URI="mongodb+srv://dbuser:password@cluster.mongodb.net/patient_db?retryWrites=true&w=majority&appName=Cluster0"
$env:DOCTOR_MONGO_URI="mongodb+srv://dbuser:password@cluster.mongodb.net/doctor_db?retryWrites=true&w=majority&appName=Cluster0"
$env:APPOINTMENT_MONGODB_URI="mongodb+srv://dbuser:password@cluster.mongodb.net/appointment_db?retryWrites=true&w=majority&appName=Cluster0"
$env:TELEMEDICINE_MONGODB_URI="mongodb+srv://dbuser:password@cluster.mongodb.net/telemedicine_db?retryWrites=true&w=majority&appName=Cluster0"

# Authentication
$env:JWT_SECRET="your-long-random-secret-value-here"
$env:JWT_EXPIRES_IN="7d"

# Payment Processing (Stripe)
$env:STRIPE_SECRET_KEY="sk_test_51TMOFm..."

# Email Notifications
$env:EMAIL_USER="your_email@gmail.com"
$env:EMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
$env:EMAIL_PROVIDER="sendgrid"
$env:EMAIL_FROM="sender@example.com"
$env:SENDGRID_API_KEY="SG.OHa2FoOtSVqViz..."

# AI Services
$env:GEMINI_API_KEY="AQ.Ab8RN6JLLpzlVMs..."
```

### Apply Secrets to Kubernetes

From the repository root, run the secret bootstrap script:

```powershell
.\scripts\apply-k8s-secrets.ps1
```

**Output should show:**
```
Applied secret: auth-service-secrets
Applied secret: patient-service-secrets
Applied secret: doctor-service-secrets
Applied secret: appointment-service-secrets
Applied secret: telemedicine-service-secrets
Applied secret: payment-service-secrets
Applied secret: notification-service-secrets
Applied secret: ai-service-secrets
All Kubernetes secrets applied successfully in namespace 'default'.
```

---

## Step 3: Build Docker Images

Navigate to the repository root and build all service images:

```powershell
# Frontend (React)
docker build -t frontend-image:latest ./frontend

# AI Symptom Checker
docker build -t ai-symptom-checker-image:latest ./services/ai-symptom-checker

# Auth Service
docker build -t auth-service-image:latest ./services/auth-service

# Patient Service
docker build -t patient-service-image:latest ./services/patient-service

# Doctor Service
docker build -t doctor-service-image:latest ./services/doctor-service

# Telemedicine Service
docker build -t telemedicine-service-image:latest ./services/telemedicine-service

# Payment Service
docker build -t payment-service-image:latest ./services/payment-service

# Notification Service
docker build -t notification-service-image:latest ./services/notification-service

# Appointment Service
docker build -t appointment-service-image:latest ./services/appointment-service
```

### Verify Images

```powershell
docker images | Select-String "image:latest"
```

Expected output:
```
frontend-image                     latest    <image-id>    <timestamp>
ai-symptom-checker-image           latest    <image-id>    <timestamp>
auth-service-image                 latest    <image-id>    <timestamp>
patient-service-image              latest    <image-id>    <timestamp>
doctor-service-image               latest    <image-id>    <timestamp>
telemedicine-service-image         latest    <image-id>    <timestamp>
payment-service-image              latest    <image-id>    <timestamp>
notification-service-image         latest    <image-id>    <timestamp>
appointment-service-image          latest    <image-id>    <timestamp>
```

---

## Step 4: Deploy to Kubernetes

### Apply Configuration Files

From the repository root, apply all Kubernetes manifests:

```powershell
# Option 1: Apply all YAML files at once
Get-ChildItem .\k8s\*.yaml | 
  Where-Object { $_.Name -notlike '*.example.yaml' } | 
  ForEach-Object { kubectl apply -f $_.FullName }

# Option 2: Apply specific manifests in order
kubectl apply -f .\k8s\api-service.yaml
kubectl apply -f .\k8s\frontend-deployment.yaml
kubectl apply -f .\k8s\frontend-service.yaml
kubectl apply -f .\k8s\auth-deployment.yaml
kubectl apply -f .\k8s\auth-service.yaml
kubectl apply -f .\k8s\patient-deployment.yaml
kubectl apply -f .\k8s\patient-service.yaml
kubectl apply -f .\k8s\doctor-deployment.yaml
kubectl apply -f .\k8s\doctor-service.yaml
kubectl apply -f .\k8s\telemedicine-deployment.yaml
kubectl apply -f .\k8s\telemedicine-service.yaml
kubectl apply -f .\k8s\appointment-deployment.yaml
kubectl apply -f .\k8s\appointment-service.yaml
kubectl apply -f .\k8s\payment-deployment.yaml
kubectl apply -f .\k8s\payment-service.yaml
kubectl apply -f .\k8s\notification-deployment.yaml
kubectl apply -f .\k8s\notification-service.yaml
kubectl apply -f .\k8s\ai-deployment.yaml
kubectl apply -f .\k8s\ai-service.yaml
kubectl apply -f .\k8s\ingress.yaml
```

### Expected Output

```
deployment.apps/frontend-deployment created
service/frontend-service created
deployment.apps/auth-service-deployment created
service/auth-service created
deployment.apps/patient-service created
service/patient-service created
deployment.apps/doctor-service-deployment created
service/doctor-service created
deployment.apps/telemedicine-service-deployment created
service/telemedicine-service created
deployment.apps/appointment-service-deployment created
service/appointment-service created
deployment.apps/payment-service-deployment created
service/payment-service created
deployment.apps/notification-service-deployment created
service/notification-service created
deployment.apps/ai-symptom-checker-deployment created
service/ai-symptom-checker-service created
ingress.networking.k8s.io/smart-healthcare-ingress created
```

---

## Step 5: Access the Platform

Open your web browser and navigate to:

```
http://smart-healthcare.local
```

You should see the Smart Healthcare Telemedicine platform homepage.

### First-Time Setup

1. **Register a Patient Account**
   - Click "Register"
   - Fill in: Email, Password, Name, Age, Gender
   - Submit

2. **Login**
   - Click "Login"
   - Enter credentials from registration
   - You'll be redirected to the Patient Dashboard

3. **Create Patient Profile**
   - Click "My Profile"
   - Fill in medical history details
   - Save profile

4. **Book an Appointment**
   - Click "Book Appointment"
   - Select a doctor
   - Choose date and time
   - Proceed to payment

5. **AI Symptom Checker** (Optional)
   - Click "Symptom Checker"
   - Enter symptoms
   - Receive AI-powered preliminary suggestion

---

## Step 6: Verify Deployment

### Check Deployment Status

```powershell
# View all deployments
kubectl get deployments

# View all pods
kubectl get pods -o wide

# View all services
kubectl get svc

# View ingress configuration
kubectl get ingress
```

### Expected Status

All deployments should show **1/1** ready, pods should show **Running**, and services should have ClusterIP assigned.

### Check Service Health

```powershell
# Frontend
curl http://smart-healthcare.local

# Auth Service
curl http://smart-healthcare.local/api/auth/health

# Patient Service
curl http://smart-healthcare.local/api/patients/health

# Payment Service
curl http://smart-healthcare.local/api/payments/health

# Notification Service
curl http://smart-healthcare.local/api/notifications/health

# AI Service
curl http://smart-healthcare.local/api/ai/health
```

### View Logs

```powershell
# Frontend logs
kubectl logs deployment/frontend-deployment --tail=50

# Auth service logs
kubectl logs deployment/auth-service-deployment --tail=50

# Payment service logs
kubectl logs deployment/payment-service-deployment --tail=50

# All service logs
kubectl logs -l app=frontend --tail=50
kubectl logs -l app=auth-service --tail=50
kubectl logs -l app=patient-service --tail=50
```

---

## Troubleshooting

### Issue: "Connection refused" when accessing http://smart-healthcare.local

**Solution:**
1. Verify Docker Desktop Kubernetes is running
2. Check ingress controller is installed and running
3. Clear browser cache and try again
4. Verify hosts file entry (Windows: `C:\Windows\System32\drivers\etc\hosts`)

### Issue: Pods are in "ErrImagePull" or "ImagePullBackOff"

**Solution:**
1. Verify all Docker images were built successfully
   ```powershell
   docker images | Select-String "image:latest"
   ```
2. Re-build the missing image
3. Redeploy the deployment

### Issue: Authentication service returning 401 errors

**Solution:**
1. Verify JWT_SECRET is set correctly in all deployments
2. Check logs:
   ```powershell
   kubectl logs deployment/auth-service-deployment --tail=100
   ```
3. Restart deployment:
   ```powershell
   kubectl rollout restart deployment/auth-service-deployment
   ```

### Issue: Database connection errors

**Solution:**
1. Verify MongoDB connection URIs in secrets
2. Ensure your MongoDB cluster is accessible
3. Check firewall rules allow connection
4. Validate credentials in MongoDB Atlas

### Issue: Payment checkout failing

**Solution:**
1. Verify Stripe API key is correct and active
2. Check payment service logs:
   ```powershell
   kubectl logs deployment/payment-service-deployment --tail=100
   ```
3. Ensure STRIPE_SECRET_KEY environment variable is set
4. Restart payment deployment

### Issue: Emails not being sent

**Solution:**
1. Verify SendGrid API key is valid
2. Check notification service logs:
   ```powershell
   kubectl logs deployment/notification-service-deployment --tail=100
   ```
3. Ensure EMAIL_USER and EMAIL_APP_PASSWORD are correct
4. Verify EMAIL_PROVIDER is set to "sendgrid"
5. Restart notification deployment:
   ```powershell
   kubectl rollout restart deployment/notification-service-deployment
   ```

### Clear All and Restart

To completely remove and redeploy the entire system:

```powershell
# Remove all resources
kubectl delete all --all

# Remove ingress
kubectl delete ingress --all

# Remove secrets
kubectl delete secrets --all

# Verify everything is removed
kubectl get all

# Re-apply secrets and deployments
.\scripts\apply-k8s-secrets.ps1
kubectl apply -f .\k8s\
```

---

## Post-Deployment Configuration

### Configure Stripe Webhooks (Optional)

1. Log in to Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to Developers → Webhooks
3. Add endpoint: `http://smart-healthcare.local/api/payments/webhook`
4. Select events: `checkout.session.completed`
5. Update webhook secret in payment service

### Enable HTTPS (Production)

For production deployments, use Let's Encrypt with cert-manager:

```powershell
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@smart-healthcare.local
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Setup Automated Backups

```powershell
# Backup MongoDB data
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net" --out ./backups

# Backup Kubernetes resources
kubectl get all --all-namespaces -o yaml > k8s-backup-$(date +%Y%m%d).yaml
```

### Monitor System Health

Install Prometheus and Grafana for monitoring:

```powershell
# Install Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack

# View Grafana dashboard
kubectl port-forward svc/prometheus-grafana 3000:80
# Access: http://localhost:3000
```

---

## API Endpoints Reference

| Service | Endpoint | Method | Purpose |
|---------|----------|--------|---------|
| **Auth** | `/api/auth/register` | POST | Register new user |
| **Auth** | `/api/auth/login` | POST | User login |
| **Auth** | `/api/auth/me` | GET | Get current user |
| **Patient** | `/api/patients/profile` | POST | Create patient profile |
| **Patient** | `/api/patients/profile/{id}` | GET | Get patient profile |
| **Doctor** | `/api/doctors` | GET | List all doctors |
| **Doctor** | `/api/doctors/apply` | POST | Apply as doctor |
| **Appointment** | `/api/appointments` | POST | Create appointment |
| **Appointment** | `/api/appointments/patient/me` | GET | Get patient appointments |
| **Payment** | `/api/payments/checkout` | POST | Create payment session |
| **Notification** | `/api/notifications/send` | POST | Send email notification |
| **AI** | `/api/ai/check-symptoms` | POST | Analyze symptoms |

---

## Support and Issues

For issues or questions:

1. Check logs: `kubectl logs deployment/<service-name> --tail=100`
2. Review troubleshooting section above
3. Verify environment variables are set correctly
4. Ensure Docker Desktop Kubernetes cluster is running
5. Check official documentation: See `docs/DEVELOPER_GUIDE.md`

---

**Last Updated:** April 17, 2026  
**Version:** 1.0
