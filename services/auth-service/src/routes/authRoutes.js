const express = require('express');

const {
  registerUser,
  registerDoctorUser,
  bootstrapFirstAdmin,
  verifyDoctorUser,
  rejectDoctorUser,
  createAdminUser,
  loginUser,
  getCurrentUser
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/doctors/register', registerDoctorUser);
router.post('/bootstrap-admin', bootstrapFirstAdmin);
router.post('/login', loginUser);
router.get('/me', protect, getCurrentUser);
router.post('/admins', protect, authorizeRoles('admin'), createAdminUser);
router.patch('/users/:userId/verify-doctor', protect, authorizeRoles('admin'), verifyDoctorUser);
router.patch('/users/:userId/reject-doctor', protect, authorizeRoles('admin'), rejectDoctorUser);

module.exports = router;
