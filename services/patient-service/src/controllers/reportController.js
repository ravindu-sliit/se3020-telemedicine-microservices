const MedicalReport = require('../models/MedicalReport');
const PatientProfile = require('../models/PatientProfile');

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

const getMyMedicalReports = async (req, res) => {
  try {
    const patientProfile = await PatientProfile.findOne({ userId: req.user.id }).select('_id');

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const reports = await MedicalReport.find({ patientId: patientProfile._id }).sort({ uploadedAt: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Medical reports retrieved successfully',
      count: reports.length,
      patientId: patientProfile._id,
      data: reports
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your medical reports',
      error: error.message
    });
  }
};

const getMedicalReportsAdminOverview = async (_req, res) => {
  try {
    const [totalReports, reportsByType, latestUploads] = await Promise.all([
      MedicalReport.countDocuments(),
      MedicalReport.aggregate([
        {
          $group: {
            _id: '$reportType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      MedicalReport.find({})
        .sort({ uploadedAt: -1, createdAt: -1 })
        .limit(10)
        .select('patientId reportType fileName mimeType uploadedAt')
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      message: 'Medical report operations overview retrieved successfully',
      data: {
        totalReports,
        reportsByType: reportsByType.map((entry) => ({
          reportType: entry._id || 'Unknown',
          count: entry.count
        })),
        latestUploads
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch report operations overview',
      error: error.message
    });
  }
};

module.exports = {
  uploadMedicalReport,
  getMedicalReportsByPatient,
  getMyMedicalReports,
  getMedicalReportsAdminOverview
};
