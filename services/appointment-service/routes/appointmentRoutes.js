const express = require('express');
const router = express.Router();
const { 
    createAppointment,
    updateAppointmentStatus,
    getPatientAppointments,
    getDoctorAppointments,
    cancelAppointment,
    rescheduleAppointment 
} = require('../controllers/appointmentController');

// TODO: Later, add Binoth's verifyToken middleware to ensure only a 'Doctor' can hit this route
// const { verifyToken, restrictToDoctor } = require('../middleware/authMiddleware');

// Route for a patient to book a new appointment
router.post('/', createAppointment);

// Route for a doctor to accept/reject an appointment
router.put('/:id/status', updateAppointmentStatus);

// Route for get appointmenrts for a patient
router.get('/patient/:patientId', getPatientAppointments);

// Route for get appointments for a doctor
router.get('/doctor/:doctorId', getDoctorAppointments);

// Route for a patient to cancel an appointment
router.put('/:id/cancel', cancelAppointment);

// Route for a patient to reschedule an appointment (could be implemented as a cancel + new booking, but here we update the existing one for simplicity)
router.put('/:id/reschedule', rescheduleAppointment);

module.exports = router;