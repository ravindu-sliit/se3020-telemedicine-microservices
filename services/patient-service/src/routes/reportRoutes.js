const express = require('express');

const { uploadMedicalReport, getMedicalReportsByPatient } = require('../controllers/reportController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { handleReportUpload } = require('../middleware/uploadMiddleware');
const { authorizeReportAccessByPatientId } = require('../middleware/reportAccessMiddleware');

const router = express.Router();

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
