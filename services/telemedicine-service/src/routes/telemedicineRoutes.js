const express = require('express');
const router = express.Router();

const {
  createSession,
  getSessionByAppointment,
  updateSessionStatus
} = require('../controllers/telemedicineController');

const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Doctor confirms an appointment -> create a secure video session
router.post('/sessions', protect, authorizeRoles('doctor'), createSession);

// Patient or Doctor: fetch session for an appointment
router.get(
  '/sessions/:appointmentId',
  protect,
  authorizeRoles('patient', 'doctor'),
  getSessionByAppointment
);

// Participant lifecycle updates (Active on join, Ended on leave)
router.put(
  '/sessions/:appointmentId/status',
  protect,
  authorizeRoles('patient', 'doctor'),
  updateSessionStatus
);

module.exports = router;
