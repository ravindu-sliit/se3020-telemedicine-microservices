const PatientProfile = require('../models/PatientProfile');

const createPatientProfile = async (req, res) => {
  try {
    const { userId, phone, dateOfBirth, gender, address, bloodGroup, allergies, chronicConditions, emergencyContact } =
      req.body;

    const isPatient = req.user?.role === 'patient';
    const effectiveUserId = isPatient ? req.user.id : userId;

    if (!effectiveUserId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    if (isPatient && userId && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: patients can only create their own profile'
      });
    }

    const existingProfile = await PatientProfile.findOne({ userId: effectiveUserId });
    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'Patient profile already exists for this userId'
      });
    }

    const patientProfile = await PatientProfile.create({
      userId: effectiveUserId,
      phone,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      allergies,
      chronicConditions,
      emergencyContact
    });

    return res.status(201).json({
      success: true,
      message: 'Patient profile created successfully',
      data: patientProfile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create patient profile',
      error: error.message
    });
  }
};

const getPatientProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId parameter is required'
      });
    }

    const patientProfile = await PatientProfile.findOne({ userId });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Patient profile retrieved successfully',
      data: patientProfile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient profile',
      error: error.message
    });
  }
};

const updatePatientProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId parameter is required'
      });
    }

    if (req.body.userId && req.body.userId !== userId) {
      return res.status(400).json({
        success: false,
        message: 'userId in request body must match route parameter'
      });
    }

    if (req.user?.role === 'patient' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: patients can only update their own profile'
      });
    }

    const updateData = {
      ...req.body,
      userId
    };

    const patientProfile = await PatientProfile.findOneAndUpdate({ userId }, updateData, {
      new: true,
      runValidators: true
    });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Patient profile updated successfully',
      data: patientProfile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update patient profile',
      error: error.message
    });
  }
};

module.exports = {
  createPatientProfile,
  getPatientProfile,
  updatePatientProfile
};
