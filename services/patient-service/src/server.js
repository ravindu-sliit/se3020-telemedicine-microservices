const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

const PORT = env.port;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`patient-service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start patient-service:', error.message);
    process.exit(1);
  }
};

startServer();
