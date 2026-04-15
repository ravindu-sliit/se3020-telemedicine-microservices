const mongoose = require('mongoose');

const PatientProfile = require('../models/PatientProfile');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const authorizeReportAccessByPatientId = async (req, res, next) => {
  try {
    const patientId = req.params.patientId || req.body.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId is required'
      });
    }

    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patientId format'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (req.user.role === 'admin' || req.user.role === 'doctor') {
      return next();
    }

    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: unsupported role for this operation'
      });
    }

    const profile = await PatientProfile.findById(patientId).select('userId');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    if (profile.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: you can only access your own medical reports'
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to validate report access',
      error: error.message
    });
  }
};

module.exports = {
  authorizeReportAccessByPatientId
};
