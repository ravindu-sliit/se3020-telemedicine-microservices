const dotenv = require('dotenv');

dotenv.config();

if (!process.env.MONGODB_URI && process.env.AUTH_MONGODB_URI) {
  process.env.MONGODB_URI = process.env.AUTH_MONGODB_URI;
}

if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '7d';
}

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const env = {
  port: Number(process.env.PORT) || 5001,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN
};

module.exports = env;
