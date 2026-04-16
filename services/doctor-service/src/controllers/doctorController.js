const mongoose = require('mongoose');
const axios = require('axios');
const Doctor = require('../models/Doctor');

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

const DEFAULT_CONSULTATION_FEE = Number(process.env.DEFAULT_DOCTOR_FEE) || 100;
const AUTH_SERVICE_BASE_URL = process.env.AUTH_SERVICE_BASE_URL || 'http://localhost:5001/api';

const defaultAvailability = [
  { dayOfWeek: 'Monday', startTime: '09:00 AM', endTime: '05:00 PM' },
  { dayOfWeek: 'Tuesday', startTime: '09:00 AM', endTime: '05:00 PM' },
  { dayOfWeek: 'Wednesday', startTime: '09:00 AM', endTime: '05:00 PM' },
  { dayOfWeek: 'Thursday', startTime: '09:00 AM', endTime: '05:00 PM' },
  { dayOfWeek: 'Friday', startTime: '09:00 AM', endTime: '05:00 PM' }
];

const normalizeStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
};

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

const getDoctorProfileByIdOrRespond = async (doctorId, res) => {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    res.status(400).json({ success: false, message: 'Invalid doctorId format' });
    return null;
  }

  const doctorProfile = await Doctor.findById(doctorId);
  if (!doctorProfile) {
    res.status(404).json({ success: false, message: 'Doctor profile not found' });
    return null;
  }

  return doctorProfile;
};

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

const applyDoctorProfile = async (req, res) => {
  try {
    const { specialty, medicalLicenseNumber, consultationFee } = req.body;

    if (!specialty || !medicalLicenseNumber || consultationFee === undefined || consultationFee === null) {
      return res.status(400).json({
        success: false,
        message: 'specialty, medicalLicenseNumber, and consultationFee are required'
      });
    }

    const existingProfile = await Doctor.findOne({ userId: req.user.id });
    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'Doctor application already exists for this user'
      });
    }

    const doctorProfile = await Doctor.create({
      userId: req.user.id,
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

const updateMyDoctorProfile = async (req, res) => {
  try {
    const doctorProfile = await Doctor.findOne({ userId: req.user.id });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor application not found'
      });
    }

    if (doctorProfile.verificationStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Rejected doctor applications cannot be updated'
      });
    }

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

const getAllApprovedDoctors = async (req, res) => {
  try {
    const approvedDoctors = await Doctor.find({
      verificationStatus: 'approved',
      isActive: true
    }).sort({ verifiedAt: -1 }).lean();

    const doctorsByUserId = new Set(approvedDoctors.map((doctor) => String(doctor.userId)));

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
    doctorProfile.verifiedBy = req.user.id;

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

const getPatientReports = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patientServiceURL = `http://localhost:5004/api/patients/reports/${patientId}`;

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

const issuePrescription = async (req, res) => {
  try {
    const { patientId, prescriptionText } = req.body;

    if (!patientId || !prescriptionText) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and prescription text are required'
      });
    }

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

const disableDoctorProfile = async (req, res) => {
  try {
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