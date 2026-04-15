const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const doctorRoutes = require('./routes/doctorRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

app.use('/api/doctors', doctorRoutes);

// Basic Health Check Route
app.get('/api/doctors/health', (req, res) => {
    res.status(200).json({ message: 'Doctor Service is running smoothly' });
});

// Database Connection
const PORT = process.env.PORT || 5002; // Using 5002 so it doesn't clash with other services
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB (Doctor DB)');
        app.listen(PORT, () => {
            console.log(`Doctor Service listening on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });