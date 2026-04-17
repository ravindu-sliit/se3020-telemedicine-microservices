/**
 * @file doctorController.js
 * @description Handles core business logic for the Doctor Microservice, including
 * profile management, administrative verification, prescription issuance, and 
 * cross-service communication (fetching patient reports).
 */

const mongoose = require('mongoose');
const axios = require('axios');
const Doctor = require('../models/Doctor');

// Define fields that a doctor is allowed to update themselves
const editableDoctorFields = [
  'fullName',
  'specialty',
  'qualifications',
  'medicalLicenseNumber',
  'yearsOfExperience',
  'consultationFee',
  'bio',
  'availability'
];

// Configuration constants loaded from environment variables
const DEFAULT_CONSULTATION_FEE = Number(process.env.DEFAULT_DOCTOR_FEE) || 100;
const AUTH_SERVICE_BASE_URL = process.env.AUTH_SERVICE_BASE_URL || 'http://localhost:5001/api';

// Default schedule provided to newly verified doctors
const defaultAvailability = [
  { dayOfWeek: 'Monday', startTime: '09:00 AM', endTime: '05:00 PM' },
  { dayOfWeek: 'Tuesday', startTime: '09:00 AM', endTime: '05:00 PM' },
  { dayOfWeek: 'Wednesday', startTime: '09:00 AM', endTime: '05:00 PM' },
  { dayOfWeek: 'Thursday', startTime: '09:00 AM', endTime: '05:00 PM' },
  { dayOfWeek: 'Friday', startTime: '09:00 AM', endTime: '05:00 PM' }
];

/**
 * Utility: Ensures inputs intended as arrays (like qualifications) are correctly
 * formatted as arrays of trimmed strings, handling edge cases where a client 
 * might send a single string instead.
 */
const normalizeStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
};

/**
 * Utility: Extracts and formats allowable fields from a request body
 * to prevent NoSQL injection or mass assignment vulnerabilities.
 */
const buildDoctorPayload = (body) => ({
  fullName: body.fullName,
  specialty: body.specialty,
  qualifications: normalizeStringArray(body.qualifications),
  medicalLicenseNumber: body.medicalLicenseNumber,
  yearsOfExperience: body.yearsOfExperience,
  consultationFee: body.consultationFee,
  bio: body.bio,
  availability: Array.isArray(body.availability) ? body.availability : []
});

/**
 * Utility: Maps a user record from the Auth Service into the standard Doctor schema format.
 * Used as a fallback when a user is verified in Auth but hasn't created a profile yet.
 */
const mapVerifiedUserToDoctor = (user) => ({
  _id: `auth-${user.id}`,
  userId: user.id,
  fullName: user.fullName,
  specialty: 'General Medicine',
  qualifications: [],
  yearsOfExperience: 0,
  consultationFee: DEFAULT_CONSULTATION_FEE,
  bio: 'Verified doctor account. Full profile details are pending completion.',
  availability: defaultAvailability,
  verificationStatus: 'approved',
  isActive: true,
  isFromAuthFallback: true
});

/**
 * Utility: Centralized error handler for database write operations.
 * Specifically checks for MongoDB duplicate key errors (code 11000).
 */
const handleWriteError = (error, res, fallbackMessage) => {
  if (error?.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0];
    const fieldLabel = duplicateField || 'field';
    return res.status(409).json({
      success: false,
      message: `A doctor application with this ${fieldLabel} already exists`
    });
  }

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
    error: error.message
  });
};

/**
 * Utility: Helper function to validate MongoDB ObjectIds and fetch a doctor profile.
 * Standardizes the 400/404 response logic across multiple admin endpoints.
 */
const getDoctorProfileByIdOrRespond = async (doctorId, res) => {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    res.status(400).json({ success: false, message: 'Invalid doctorId format' });
    return null; // Return null signals the caller to halt execution
  }

  const doctorProfile = await Doctor.findById(doctorId);
  if (!doctorProfile) {
    res.status(404).json({ success: false, message: 'Doctor profile not found' });
    return null;
  }

  return doctorProfile;
};

/**
 * Utility: Ensures a profile is currently 'pending' before allowing 
 * state transitions like 'approve' or 'reject'.
 */
const ensurePendingReviewStatus = (doctorProfile, res, action) => {
  if (doctorProfile.verificationStatus !== 'pending') {
    res.status(409).json({
      success: false,
      message: `Doctor application must be pending before it can be ${action}`
    });
    return false;
  }

  return true;
};

// ==========================================
// DOCTOR ROUTES (Profile Management)
// ==========================================

/**
 * @desc    Submit a new application to become a doctor
 * @route   POST /api/doctors/apply
 * @access  Private (Doctor role required)
 */
const applyDoctorProfile = async (req, res) => {
  try {
    const { specialty, medicalLicenseNumber, consultationFee } = req.body;

    // Strict validation for required application fields
    if (!specialty || !medicalLicenseNumber || consultationFee === undefined || consultationFee === null) {
      return res.status(400).json({
        success: false,
        message: 'specialty, medicalLicenseNumber, and consultationFee are required'
      });
    }

    // Ensure a user cannot submit multiple applications
    const existingProfile = await Doctor.findOne({ userId: req.user.id });
    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'Doctor application already exists for this user'
      });
    }

    const doctorProfile = await Doctor.create({
      userId: req.user.id, // Securely mapped from JWT token
      ...buildDoctorPayload(req.body),
      verificationStatus: 'pending',
      submittedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Doctor application submitted successfully',
      data: doctorProfile
    });
  } catch (error) {
    return handleWriteError(error, res, 'Failed to submit doctor application');
  }
};

/**
 * @desc    Fetch the logged-in doctor's profile
 * @route   GET /api/doctors/me
 * @access  Private (Doctor role required)
 */
const getMyDoctorProfile = async (req, res) => {
  try {
    const doctorProfile = await Doctor.findOne({ userId: req.user.id });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor application not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Doctor application retrieved successfully',
      data: doctorProfile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor application',
      error: error.message
    });
  }
};

/**
 * @desc    Update the logged-in doctor's profile
 * @route   PUT /api/doctors/me
 * @access  Private (Doctor role required)
 */
const updateMyDoctorProfile = async (req, res) => {
  try {
    const doctorProfile = await Doctor.findOne({ userId: req.user.id });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor application not found'
      });
    }

    // Business Logic: Prevent updates if the application was rejected
    if (doctorProfile.verificationStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Rejected doctor applications cannot be updated'
      });
    }

    // Safely apply updates only to allowed fields
    editableDoctorFields.forEach((field) => {
      if (field === 'qualifications' && Object.prototype.hasOwnProperty.call(req.body, field)) {
        doctorProfile[field] = normalizeStringArray(req.body[field]);
        return;
      }

      if (field === 'availability' && Object.prototype.hasOwnProperty.call(req.body, field)) {
        doctorProfile[field] = Array.isArray(req.body[field]) ? req.body[field] : [];
        return;
      }

      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        doctorProfile[field] = req.body[field];
      }
    });

    await doctorProfile.save();

    return res.status(200).json({
      success: true,
      message: 'Doctor application updated successfully',
      data: doctorProfile
    });
  } catch (error) {
    return handleWriteError(error, res, 'Failed to update doctor application');
  }
};

// ==========================================
// ADMIN ROUTES (Verification Flow)
// ==========================================

/**
 * @desc    Fetch all applications waiting for admin approval
 * @route   GET /api/doctors/pending
 * @access  Private (Admin role required)
 */
const getPendingDoctorApplications = async (_req, res) => {
  try {
    const applications = await Doctor.find({ verificationStatus: 'pending' }).sort({ submittedAt: 1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending applications',
      error: error.message
    });
  }
};

/**
 * @desc    Fetch all fully approved, active doctors (Combines local DB with Auth Service)
 * @route   GET /api/doctors
 * @access  Public / Patient
 */
const getAllApprovedDoctors = async (req, res) => {
  try {
    // 1. Fetch locally completed profiles
    const approvedDoctors = await Doctor.find({
      verificationStatus: 'approved',
      isActive: true
    }).sort({ verifiedAt: -1 }).lean();

    const doctorsByUserId = new Set(approvedDoctors.map((doctor) => String(doctor.userId)));

    // 2. Fetch verified users from Auth Service to catch users who haven't completed profiles yet
    let verifiedUsers = [];
    try {
      const response = await axios.get(`${AUTH_SERVICE_BASE_URL}/auth/doctors/verified`, {
        headers: {
          Authorization: req.headers.authorization
        }
      });

      verifiedUsers = Array.isArray(response?.data?.data) ? response.data.data : [];
    } catch (_error) {
      verifiedUsers = [];
    }

    // 3. Map Auth users to temporary Doctor objects if they don't exist locally
    const fallbackDoctors = verifiedUsers
      .filter((user) => !doctorsByUserId.has(String(user.id)))
      .map(mapVerifiedUserToDoctor);

    const data = [...approvedDoctors, ...fallbackDoctors];

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      error: error.message
    });
  }
};

/**
 * @desc    Fetch a specific application by its Mongo ID
 * @route   GET /api/doctors/:doctorId
 * @access  Private (Admin role required)
 */
const getDoctorApplicationById = async (req, res) => {
  try {
    const doctorProfile = await getDoctorProfileByIdOrRespond(req.params.doctorId, res);
    if (!doctorProfile) return;

    return res.status(200).json({ success: true, data: doctorProfile });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

/**
 * @desc    Approve a pending application
 * @route   PATCH /api/doctors/:doctorId/approve
 * @access  Private (Admin role required)
 */
const approveDoctorApplication = async (req, res) => {
  try {
    const doctorProfile = await getDoctorProfileByIdOrRespond(req.params.doctorId, res);
    if (!doctorProfile) return;

    if (!ensurePendingReviewStatus(doctorProfile, res, 'approved')) {
      return;
    }

    doctorProfile.verificationStatus = 'approved';
    doctorProfile.verificationNotes = req.body.verificationNotes || undefined;
    doctorProfile.verifiedAt = new Date();
    doctorProfile.verifiedBy = req.user.id; // Tracks which admin approved it

    await doctorProfile.save();

    return res.status(200).json({
      success: true,
      message: 'Doctor application approved',
      data: doctorProfile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve application',
      error: error.message
    });
  }
};

/**
 * @desc    Reject a pending application
 * @route   PATCH /api/doctors/:doctorId/reject
 * @access  Private (Admin role required)
 */
const rejectDoctorApplication = async (req, res) => {
  try {
    const doctorProfile = await getDoctorProfileByIdOrRespond(req.params.doctorId, res);
    if (!doctorProfile) return;

    if (!ensurePendingReviewStatus(doctorProfile, res, 'rejected')) {
      return;
    }

    doctorProfile.verificationStatus = 'rejected';
    doctorProfile.verificationNotes = req.body.verificationNotes || undefined;
    doctorProfile.verifiedAt = new Date();
    doctorProfile.verifiedBy = req.user.id;

    await doctorProfile.save();

    return res.status(200).json({
      success: true,
      message: 'Doctor application rejected',
      data: doctorProfile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reject application',
      error: error.message
    });
  }
};

// ==========================================
// MEDICAL OPERATIONS (Cross-Service)
// ==========================================

/**
 * @desc    Fetch medical reports for a specific patient
 * @route   GET /api/doctors/patients/:patientId/reports
 * @access  Private (Doctor role required)
 * @note    This relies on cross-service communication to the Patient Service
 */
const getPatientReports = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Hardcoded URL pointing to Patient Microservice (typically defined in .env)
    const patientServiceURL = `http://localhost:5004/api/patients/reports/${patientId}`;

    // Pass the Doctor's JWT token along so the Patient Service trusts the request
    const config = {
      headers: {
        Authorization: req.headers.authorization
      }
    };

    const response = await axios.get(patientServiceURL, config);

    return res.status(200).json({
      success: true,
      message: 'Patient reports fetched successfully',
      data: response.data
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'No reports found for this patient'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error communicating with Patient Service',
      error: error.message
    });
  }
};

/**
 * @desc    Issue a digital prescription to a patient
 * @route   POST /api/doctors/prescriptions
 * @access  Private (Doctor role required)
 */
const issuePrescription = async (req, res) => {
  try {
    const { patientId, prescriptionText } = req.body;

    if (!patientId || !prescriptionText) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and prescription text are required'
      });
    }

    // Security: Find doctor by JWT token, ensuring they are active and approved
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user.id, isActive: true, verificationStatus: 'approved' },
      {
        $push: {
          digitalPrescriptions: {
            patientId,
            prescriptionText
          }
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Approved/Active doctor profile not found'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Prescription issued successfully',
      data: doctor.digitalPrescriptions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * @desc    Disable a doctor's profile (Soft Delete)
 * @route   PUT /api/doctors/disable
 * @access  Private (Doctor role required)
 */
const disableDoctorProfile = async (req, res) => {
  try {
    // Sets isActive to false and clears availability so patients can't book them
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user.id },
      {
        isActive: false,
        availability: []
      },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Doctor profile disabled successfully',
      data: doctor
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
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
};