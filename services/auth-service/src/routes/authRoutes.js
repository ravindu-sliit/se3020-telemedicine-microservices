const express = require('express');

const {
  registerUser,
  registerDoctorUser,
  bootstrapFirstAdmin,
  verifyDoctorUser,
  rejectDoctorUser,
  createAdminUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  getCurrentUser,
  updateMyAccount,
  getAllUsers,
  createUserByAdmin,
  updateUserByAdmin,
  getVerifiedDoctors,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  deleteMyAccount
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/doctors/register', registerDoctorUser);
router.post('/bootstrap-admin', bootstrapFirstAdmin);
router.post('/login', loginUser);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getCurrentUser);
router.put('/me', protect, authorizeRoles('patient'), updateMyAccount);
router.delete('/me', protect, authorizeRoles('patient', 'doctor'), deleteMyAccount);
router.post('/admins', protect, authorizeRoles('admin'), createAdminUser);
router.patch('/users/:userId/verify-doctor', protect, authorizeRoles('admin'), verifyDoctorUser);
router.patch('/users/:userId/reject-doctor', protect, authorizeRoles('admin'), rejectDoctorUser);

router.get('/users', protect, authorizeRoles('admin'), getAllUsers);
router.post('/users', protect, authorizeRoles('admin'), createUserByAdmin);
router.get('/doctors/verified', protect, authorizeRoles('patient', 'doctor', 'admin'), getVerifiedDoctors);
router.put('/users/:userId/role', protect, authorizeRoles('admin'), updateUserRole);
router.put('/users/:userId/status', protect, authorizeRoles('admin'), updateUserStatus);
router.put('/users/:userId', protect, authorizeRoles('admin'), updateUserByAdmin);
router.delete('/users/:userId', protect, authorizeRoles('admin'), deleteUser);

module.exports = router;
