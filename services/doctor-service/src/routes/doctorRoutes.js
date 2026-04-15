const express = require('express');

const {
  applyDoctorProfile,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  getPendingDoctorApplications,
  getDoctorApplicationById,
  approveDoctorApplication,
  rejectDoctorApplication
} = require('../controllers/doctorController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/apply', protect, authorizeRoles('doctor'), applyDoctorProfile);
router.get('/me', protect, authorizeRoles('doctor'), getMyDoctorProfile);
router.put('/me', protect, authorizeRoles('doctor'), updateMyDoctorProfile);
router.get('/pending', protect, authorizeRoles('admin'), getPendingDoctorApplications);
router.get('/:doctorId', protect, authorizeRoles('admin'), getDoctorApplicationById);
router.patch('/:doctorId/approve', protect, authorizeRoles('admin'), approveDoctorApplication);
router.patch('/:doctorId/reject', protect, authorizeRoles('admin'), rejectDoctorApplication);

module.exports = router;
