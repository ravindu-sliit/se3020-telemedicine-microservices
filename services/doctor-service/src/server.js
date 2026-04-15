const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`doctor-service running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start doctor-service:', error.message);
    process.exit(1);
  }
};

startServer();
