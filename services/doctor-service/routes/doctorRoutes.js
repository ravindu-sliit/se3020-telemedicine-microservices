const express = require('express');
const router = express.Router();
const { 
    createDoctorProfile, 
    getDoctorProfile, 
    updateAvailability,
    disableDoctorProfile,
    issuePrescription,
    getPatientReports
} = require('../controllers/doctorController');

// Route to create a new doctor profile
router.post('/', createDoctorProfile);

// Route to get a doctor's profile
router.get('/:id', getDoctorProfile);

// Route to update availability
router.put('/:id/availability', updateAvailability);

// Route to disable a doctor profile
router.put('/:id/disable', disableDoctorProfile);

// Route to issue a digital prescription
router.post('/:id/prescriptions', issuePrescription);

// Route for a doctor to view a patient's uploaded reports
router.get('/:id/patients/:patientId/reports', getPatientReports);

module.exports = router;