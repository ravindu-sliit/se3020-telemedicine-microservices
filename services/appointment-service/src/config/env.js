const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const env = {
  port: Number(process.env.PORT) || 5003,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  authServiceBaseUrl: process.env.AUTH_SERVICE_BASE_URL || 'http://auth-service:5001/api',
  patientServiceBaseUrl: process.env.PATIENT_SERVICE_BASE_URL || 'http://patient-service:5002/api',
  notificationApiUrl:
    process.env.NOTIFICATION_API_URL || 'http://notification-service:5007/api/notifications/send'
};

module.exports = env;
