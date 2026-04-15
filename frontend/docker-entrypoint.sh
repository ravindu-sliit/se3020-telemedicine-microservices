#!/bin/sh
set -eu

cat <<EOF >/usr/share/nginx/html/env.js
window.__APP_CONFIG__ = {
  REACT_APP_AUTH_API_URL: "${REACT_APP_AUTH_API_URL:-http://localhost:5001/api}",
  REACT_APP_PATIENT_API_URL: "${REACT_APP_PATIENT_API_URL:-http://localhost:5002/api}",
  REACT_APP_AI_API_URL: "${REACT_APP_AI_API_URL:-http://localhost:5005/api}",
  REACT_APP_PAYMENT_API_URL: "${REACT_APP_PAYMENT_API_URL:-http://localhost:5006/api}",
  REACT_APP_NOTIFICATION_API_URL: "${REACT_APP_NOTIFICATION_API_URL:-http://localhost:5007/api}",
  REACT_APP_STRIPE_PUBLISHABLE_KEY: "${REACT_APP_STRIPE_PUBLISHABLE_KEY:-}"
};
EOF

exec nginx -g 'daemon off;'
