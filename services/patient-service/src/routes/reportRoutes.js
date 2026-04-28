const express = require('express');

const {
	uploadMedicalReport,
	getMedicalReportsByPatient,
	getMyMedicalReports,
	getMedicalReportsAdminOverview
} = require('../controllers/reportController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { handleReportUpload } = require('../middleware/uploadMiddleware');
const { authorizeReportAccessByPatientId } = require('../middleware/reportAccessMiddleware');

const router = express.Router();

router.get('/me', protect, authorizeRoles('patient'), getMyMedicalReports);
router.get('/admin/overview', protect, authorizeRoles('admin'), getMedicalReportsAdminOverview);

router.post(
	'/',
	protect,
	authorizeRoles('patient', 'doctor', 'admin'),
	handleReportUpload,
	authorizeReportAccessByPatientId,
	uploadMedicalReport
);
router.get(
	'/:patientId',
	protect,
	authorizeRoles('patient', 'doctor', 'admin'),
	authorizeReportAccessByPatientId,
	getMedicalReportsByPatient
);

module.exports = router;
