const express = require('express');
const router = express.Router();
const { 
    createAppointment,
    updateAppointmentStatus,
    getPatientAppointments,
    getDoctorAppointments,
    cancelAppointment,
    rescheduleAppointment,
    getAppointmentsAdminOverview
} = require('../controllers/appointmentController');

const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// ==========================================
// PATIENT ROUTES
// ==========================================

// Book a new appointment
router.post('/', protect, authorizeRoles('patient'), createAppointment);

// Get all appointments for the logged-in patient
router.get('/patient/me', protect, authorizeRoles('patient'), getPatientAppointments);

// Get platform-level appointment metrics for admin operations dashboard
router.get('/admin/overview', protect, authorizeRoles('admin'), getAppointmentsAdminOverview);

// Cancel an appointment
router.put('/:id/cancel', protect, authorizeRoles('patient'), cancelAppointment);

// Reschedule an appointment
router.put('/:id/reschedule', protect, authorizeRoles('patient'), rescheduleAppointment);


// ==========================================
// DOCTOR ROUTES
// ==========================================

// Get all appointments assigned to the logged-in doctor
router.get('/doctor/me', protect, authorizeRoles('doctor'), getDoctorAppointments);

// Accept (Confirm) or Reject (Cancel) an appointment
router.put('/:id/status', protect, authorizeRoles('doctor'), updateAppointmentStatus);


module.exports = router;