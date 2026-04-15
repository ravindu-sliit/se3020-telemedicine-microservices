const User = require('../models/User');
const generateToken = require('../utils/generateToken');

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

module.exports = {
  registerUser,
  registerDoctorUser,
  bootstrapFirstAdmin,
  verifyDoctorUser,
  rejectDoctorUser,
  createAdminUser,
  loginUser,
  getCurrentUser
};
