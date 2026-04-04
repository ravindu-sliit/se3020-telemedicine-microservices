const express = require('express');

const {
  createPatientProfile,
  getPatientProfile,
  updatePatientProfile
} = require('../controllers/patientController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const authorizeProfileAccess = require('../middleware/profileAccessMiddleware');

const router = express.Router();

router.post('/profile', protect, authorizeRoles('patient', 'admin'), createPatientProfile);
router.get(
  '/profile/:userId',
  protect,
  authorizeRoles('patient', 'doctor', 'admin'),
  authorizeProfileAccess,
  getPatientProfile
);
router.put(
  '/profile/:userId',
  protect,
  authorizeRoles('patient', 'admin'),
  authorizeProfileAccess,
  updatePatientProfile
);

module.exports = router;
