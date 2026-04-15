const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/healthRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*'
  })
);
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/doctors', doctorRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;
