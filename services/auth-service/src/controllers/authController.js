const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');

const buildUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  status: user.status,
  isVerified: user.isVerified
});

const validateRequiredCredentials = (fullName, email, password, res) => {
  if (!fullName || !email || !password) {
    res.status(400).json({
      success: false,
      message: 'fullName, email, and password are required'
    });

    return false;
  }

  return true;
};

const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!validateRequiredCredentials(fullName, email, password, res)) {
      return;
    }

    const supportedRoles = ['patient', 'doctor', 'admin'];
    const requestedRole = role || 'patient';

    if (!supportedRoles.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed roles are patient, doctor, and admin'
      });
    }

    if (requestedRole !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Public registration is limited to patient accounts'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const user = await User.create({ fullName, email, password, role: 'patient' });
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: buildUserResponse(user)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

const registerDoctorUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!validateRequiredCredentials(fullName, email, password, res)) {
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role: 'doctor',
      status: 'active',
      isVerified: false
    });
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Doctor account created successfully. Verification is still pending.',
      data: {
        token,
        user: buildUserResponse(user)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Doctor registration failed',
      error: error.message
    });
  }
};

const bootstrapFirstAdmin = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!validateRequiredCredentials(fullName, email, password, res)) {
      return;
    }

    const existingAdminCount = await User.countDocuments({ role: 'admin' });
    if (existingAdminCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Bootstrap admin creation is disabled because an admin account already exists'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role: 'admin',
      status: 'active',
      isVerified: true
    });
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'First admin account created successfully',
      data: {
        token,
        user: buildUserResponse(user)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create first admin account',
      error: error.message
    });
  }
};

const updateDoctorVerificationStatus = async (req, res, isVerified) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Verification updates are only supported for doctor accounts'
      });
    }

    user.isVerified = isVerified;
    await user.save();

    return res.status(200).json({
      success: true,
      message: isVerified ? 'Doctor user verified successfully' : 'Doctor user marked as unverified successfully',
      data: {
        user: buildUserResponse(user)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update doctor verification status',
      error: error.message
    });
  }
};

const verifyDoctorUser = (req, res) => updateDoctorVerificationStatus(req, res, true);

const rejectDoctorUser = (req, res) => updateDoctorVerificationStatus(req, res, false);

const createAdminUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!validateRequiredCredentials(fullName, email, password, res)) {
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role: 'admin',
      status: 'active',
      isVerified: true
    });

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        user: buildUserResponse(user)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create admin account',
      error: error.message
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status}. Please contact an administrator.`
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: buildUserResponse(user)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');
    const responseBody = {
      success: true,
      message: 'If an account exists for this email, a password reset link has been generated.'
    };

    if (!user) {
      return res.status(200).json(responseBody);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    return res.status(200).json({
      ...responseBody,
      data: {
        resetToken,
        expiresInMinutes: 60
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to request password reset',
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch current user',
      error: error.message
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const formattedUsers = users.map(buildUserResponse);
    return res.status(200).json({ success: true, count: formattedUsers.length, data: formattedUsers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

const createUserByAdmin = async (req, res) => {
  try {
    const { fullName, email, password, role = 'patient', status = 'active', isVerified } = req.body;

    if (!validateRequiredCredentials(fullName, email, password, res)) {
      return;
    }

    if (!['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role,
      status,
      isVerified: role === 'admin' ? true : typeof isVerified === 'boolean' ? isVerified : false
    });

    return res.status(201).json({
      success: true,
      message: 'User account created successfully',
      data: buildUserResponse(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create user account', error: error.message });
  }
};

const updateUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, password, role, status, isVerified } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role && !['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (status && !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (userId === req.user.id && role && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Admins cannot remove their own admin role' });
    }

    if (userId === req.user.id && status && status !== 'active') {
      return res.status(400).json({ success: false, message: 'Admins cannot disable their own account' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'A user with this email already exists'
        });
      }
      user.email = email;
    }

    if (fullName) user.fullName = fullName;
    if (password) user.password = password;
    if (role) user.role = role;
    if (status) user.status = status;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User account updated successfully',
      data: buildUserResponse(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user account', error: error.message });
  }
};

const getVerifiedDoctors = async (_req, res) => {
  try {
    const users = await User.find({
      role: 'doctor',
      isVerified: true,
      status: 'active'
    })
      .select('-password')
      .sort({ createdAt: -1 });

    const formattedUsers = users.map(buildUserResponse);

    return res.status(200).json({
      success: true,
      count: formattedUsers.length,
      data: formattedUsers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch verified doctors',
      error: error.message
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userId === req.user.id && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Admins cannot remove their own admin role' });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({ success: true, message: 'User role updated successfully', data: buildUserResponse(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user role', error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (userId === req.user.id && status !== 'active') {
      return res.status(400).json({ success: false, message: 'Admins cannot disable their own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User account marked as ${status}`,
      data: buildUserResponse(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user status', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Admins cannot delete their own account' });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'User account deleted successfully',
      data: buildUserResponse(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
};

module.exports = {
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
  getAllUsers,
  createUserByAdmin,
  updateUserByAdmin,
  getVerifiedDoctors,
  updateUserRole,
  updateUserStatus,
  deleteUser
};
