const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const dns = require('dns');

dns.setServers(["1.1.1.1","8.8.8.8"]);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`auth-service running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start auth-service:', error.message);
    process.exit(1);
  }
};

startServer();
