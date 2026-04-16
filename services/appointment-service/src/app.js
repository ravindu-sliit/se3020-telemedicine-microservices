const express = require('express');
const cors = require('cors');

const appointmentRoutes = require('./routes/appointmentRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*'
  })
);
app.use(express.json());


app.use('/api/health', healthRoutes);
app.use('/api/appointments', appointmentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;