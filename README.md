# se3020-telemedicine-microservices

Smart Healthcare Platform with a React frontend and Node.js microservices.

## Member 1 Scope (Auth + Patient Security)

This section documents the authentication and authorization mechanisms for the patient domain.

### Authentication Flow

1. Client registers or logs in through auth-service.
2. auth-service validates credentials and returns a JWT.
3. Client sends JWT in Authorization: Bearer <token> for protected endpoints.
4. auth-service and patient-service verify JWT and attach decoded claims to req.user.

### JWT Usage

- Token claims include id, email, and role.
- Token signing happens in auth-service.
- Token verification happens in both auth-service and patient-service with JWT_SECRET.
- patient-service validates required env vars (including JWT_SECRET) at startup.

### RBAC Logic

- Supported roles: patient, doctor, admin.
- Public registration is restricted to patient role.
- Patient profile routes are protected by JWT + role middleware + ownership checks.
- Medical report routes are protected by JWT + role middleware + patient ownership checks.

### Security Mechanisms Implemented

- Password hashing with bcrypt pre-save hook.
- JWT-based stateless authentication.
- Route protection via token verification middleware.
- Role-based authorization middleware.
- Ownership enforcement for patient profile and report access.
- Report upload validation:
	- Allowed MIME/extension: PDF, PNG, JPG, JPEG
	- Maximum file size: 5MB

### Testing Evidence (Postman)

Postman collection for Member 1 deliverables:

- postman/member1-auth-patient-flow.postman_collection.json

Covered scenarios:

- Register patient
- Login patient
- Fetch current user
- Create/get/update patient profile
- Upload/get own medical report
- Negative case: register as admin should fail
- Negative case: invalid token should fail

## Project Structure

- `frontend/`: React asynchronous web client
- `services/`: Backend Node.js microservices
- `k8s/`: Kubernetes manifests

## Initial Setup

1. Clone the repository.
2. Install dependencies per module (frontend and each service).
3. Configure environment variables using `.env` files.
4. Run services locally or deploy via Kubernetes manifests in `k8s/`.

## Notes

- Keep `node_modules/` and `.env` out of version control.
- Add service-specific README files and Dockerfiles as implementation progresses.
- `.gitkeep` files are intentionally included in empty directories so the full project structure is visible to collaborators on push.
