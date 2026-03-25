# se3020-telemedicine-microservices

Smart Healthcare Platform with a React frontend and Node.js microservices.

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
