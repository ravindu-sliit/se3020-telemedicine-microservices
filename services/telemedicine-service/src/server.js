const dotenv = require('dotenv');
const dns = require('dns');

dns.setServers(['1.1.1.1', '8.8.8.8']);

dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`telemedicine-service running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start telemedicine-service:', error.message);
    process.exit(1);
  }
};

startServer();
