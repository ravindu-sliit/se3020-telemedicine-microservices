const express = require('express');
const router = express.Router();
const { updateAppointmentStatus } = require('../controllers/appointmentController');

// TODO: Later, add Binoth's verifyToken middleware to ensure only a 'Doctor' can hit this route
// const { verifyToken, restrictToDoctor } = require('../middleware/authMiddleware');

// Route for a doctor to accept/reject an appointment
router.put('/:id/status', updateAppointmentStatus);

module.exports = router;