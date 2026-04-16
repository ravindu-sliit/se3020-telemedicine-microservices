const express = require('express');
const router = express.Router();

const {
    applyDoctorProfile,
    getMyDoctorProfile,
    updateMyDoctorProfile,
    getPendingDoctorApplications,
    getAllApprovedDoctors,
    getDoctorApplicationById,
    approveDoctorApplication,
    rejectDoctorApplication,
    getPatientReports,
    issuePrescription,
    disableDoctorProfile
} = require('../controllers/doctorController');

const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');


router.post('/apply', protect, authorizeRoles('doctor'), applyDoctorProfile);
router.get('/me', protect, authorizeRoles('doctor'), getMyDoctorProfile);
router.put('/me', protect, authorizeRoles('doctor'), updateMyDoctorProfile);
router.get('/', protect, authorizeRoles('admin', 'patient', 'doctor'), getAllApprovedDoctors);

router.get('/pending', protect, authorizeRoles('admin'), getPendingDoctorApplications);
router.get('/:doctorId', protect, authorizeRoles('admin'), getDoctorApplicationById);
router.patch('/:doctorId/approve', protect, authorizeRoles('admin'), approveDoctorApplication);
router.patch('/:doctorId/reject', protect, authorizeRoles('admin'), rejectDoctorApplication);

// Doctor viewing patient reports via cross-service call
router.get('/patients/:patientId/reports', protect, authorizeRoles('doctor'), getPatientReports);

// Doctor issuing a prescription
router.post('/prescriptions', protect, authorizeRoles('doctor'), issuePrescription);

// Doctor disabling their own account (Soft Delete)
router.put('/disable', protect, authorizeRoles('doctor'), disableDoctorProfile);

module.exports = router;