const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const env = {
  port: Number(process.env.PORT) || 5002,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET
};

module.exports = env;
