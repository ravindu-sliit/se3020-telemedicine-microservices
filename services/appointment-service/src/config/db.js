const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    if (error.message?.toLowerCase().includes('authentication failed')) {
      try {
        const parsed = new URL(process.env.MONGODB_URI || '');
        const username = decodeURIComponent(parsed.username || '');
        const database = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.slice(1) : '(none)';
        console.error(
          `MongoDB auth failed for user "${username || '(missing)'}" on host "${parsed.host}" and database "${database}".`
        );
      } catch {
        console.error('Unable to parse MONGODB_URI for auth diagnostics.');
      }
      console.error('Check MONGODB_URI credentials in services/doctor-service/.env and verify the Atlas database user.');
    }

    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = connectDB;
