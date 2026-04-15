const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import the appointment routes you created earlier
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

// 1. Middleware Setup
app.use(cors()); // Allows Supethum's React frontend to communicate with this API
app.use(express.json()); // Parses incoming JSON data from HTTP requests

// 2. Health Check Route
// Useful for Soori when he sets up Kubernetes to verify if the pod is alive
app.get('/api/appointments/health', (req, res) => {
    res.status(200).json({ message: 'Appointment Service is running smoothly' });
});

// 3. Mount the Routes
// All routes inside appointmentRoutes will now be prefixed with /api/appointments
app.use('/api/appointments', appointmentRoutes);

// 4. Environment Variables
// Using port 5003 so it runs independently alongside your Doctor Service (5002)
const PORT = process.env.PORT || 5003; 
const MONGO_URI = process.env.MONGO_URI;

// 5. Database Connection and Server Initialization
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB (Appointment DB)');
        
        // Only start the Express server if the database connects successfully
        app.listen(PORT, () => {
            console.log(`Appointment Service listening on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Stop the app if it can't connect to the database
    });