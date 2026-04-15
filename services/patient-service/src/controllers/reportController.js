const MedicalReport = require('../models/MedicalReport');

const uploadMedicalReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Report file is required'
      });
    }

    const { patientId, reportType, notes } = req.body;

    if (!patientId || !reportType) {
      return res.status(400).json({
        success: false,
        message: 'patientId and reportType are required'
      });
    }

    const report = await MedicalReport.create({
      patientId,
      fileName: req.file.filename,
      storagePath: req.file.path,
      mimeType: req.file.mimetype,
      reportType,
      notes,
      uploadedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Medical report uploaded successfully',
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload medical report',
      error: error.message
    });
  }
};

const getMedicalReportsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId parameter is required'
      });
    }

    const reports = await MedicalReport.find({ patientId }).sort({ uploadedAt: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Medical reports retrieved successfully',
      count: reports.length,
      data: reports
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medical reports',
      error: error.message
    });
  }
};

module.exports = {
  uploadMedicalReport,
  getMedicalReportsByPatient
};
