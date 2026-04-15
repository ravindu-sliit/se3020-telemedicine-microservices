const dotenv = require('dotenv');

dotenv.config();

const mongodbUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const requiredEnvVars = ['JWT_SECRET'];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

if (!mongodbUri) {
  throw new Error('Missing required environment variable: MONGO_URI');
}

const env = {
  port: Number(process.env.PORT) || 5002,
  mongodbUri,
  jwtSecret: process.env.JWT_SECRET
};

module.exports = env;
