const mongoose = require('mongoose');
const axios = require('axios');
const Doctor = require('../models/Doctor');

const editableDoctorFields = ['specialty', 'qualifications', 'medicalLicenseNumber', 'yearsOfExperience', 'consultationFee', 'bio', 'availability'];

const normalizeStringArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return [String(value).trim()].filter(Boolean);
};

const buildDoctorPayload = (body) => ({
    specialty: body.specialty,
    qualifications: normalizeStringArray(body.qualifications),
    medicalLicenseNumber: body.medicalLicenseNumber,
    yearsOfExperience: body.yearsOfExperience,
    consultationFee: body.consultationFee,
    bio: body.bio,
    availability: Array.isArray(body.availability) ? body.availability : []
});

const handleWriteError = (error, res, fallbackMessage) => {
    if (error?.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern || {})[0];
        const fieldLabel = duplicateField === 'medicalLicenseNumber' ? 'medicalLicenseNumber' : duplicateField || 'field';
        return res.status(409).json({ success: false, message: `A doctor application with this ${fieldLabel} already exists` });
    }
    return res.status(500).json({ success: false, message: fallbackMessage, error: error.message });
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
        res.status(409).json({ success: false, message: `Doctor application must be pending before it can be ${action}` });
        return false;
    }
    return true;
};

const applyDoctorProfile = async (req, res) => {
    try {
        const { specialty, medicalLicenseNumber, consultationFee } = req.body;
        if (!specialty || !medicalLicenseNumber || consultationFee === undefined || consultationFee === null) {
            return res.status(400).json({ success: false, message: 'specialty, medicalLicenseNumber, and consultationFee are required' });
        }

        const existingProfile = await Doctor.findOne({ userId: req.user.id });
        if (existingProfile) {
            return res.status(409).json({ success: false, message: 'Doctor application already exists for this user' });
        }

        const doctorProfile = await Doctor.create({
            userId: req.user.id,
            ...buildDoctorPayload(req.body),
            verificationStatus: 'pending',
            submittedAt: new Date(),
        });

        return res.status(201).json({ success: true, message: 'Doctor application submitted successfully', data: doctorProfile });
    } catch (error) {
        return handleWriteError(error, res, 'Failed to submit doctor application');
    }
};

const getMyDoctorProfile = async (req, res) => {
    try {
        const doctorProfile = await Doctor.findOne({ userId: req.user.id });
        if (!doctorProfile) return res.status(404).json({ success: false, message: 'Doctor application not found' });
        return res.status(200).json({ success: true, message: 'Doctor application retrieved successfully', data: doctorProfile });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch doctor application', error: error.message });
    }
};

const updateMyDoctorProfile = async (req, res) => {
    try {
        const doctorProfile = await Doctor.findOne({ userId: req.user.id });
        if (!doctorProfile) return res.status(404).json({ success: false, message: 'Doctor application not found' });
        
        // Note: Binoth restricted updates to pending applications only. 
        // If doctors need to update availability AFTER being approved, you may need to adjust this logic later.
        if (doctorProfile.verificationStatus !== 'pending') {
            return res.status(403).json({ success: false, message: 'Only pending doctor applications can be updated' });
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
        return res.status(200).json({ success: true, message: 'Doctor application updated successfully', data: doctorProfile });
    } catch (error) {
        return handleWriteError(error, res, 'Failed to update doctor application');
    }
};

const getPendingDoctorApplications = async (req, res) => {
    try {
        const applications = await Doctor.find({ verificationStatus: 'pending' }).sort({ submittedAt: 1 });
        return res.status(200).json({ success: true, count: applications.length, data: applications });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch pending applications', error: error.message });
    }
};

const getDoctorApplicationById = async (req, res) => {
    try {
        const doctorProfile = await getDoctorProfileByIdOrRespond(req.params.doctorId, res);
        if (!doctorProfile) return;
        return res.status(200).json({ success: true, data: doctorProfile });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch application', error: error.message });
    }
};

const approveDoctorApplication = async (req, res) => {
    try {
        const doctorProfile = await getDoctorProfileByIdOrRespond(req.params.doctorId, res);
        if (!doctorProfile) return;
        if (!ensurePendingReviewStatus(doctorProfile, res, 'approved')) return;

        doctorProfile.verificationStatus = 'approved';
        doctorProfile.verificationNotes = req.body.verificationNotes || undefined;
        doctorProfile.verifiedAt = new Date();
        doctorProfile.verifiedBy = req.user.id;

        await doctorProfile.save();
        return res.status(200).json({ success: true, message: 'Doctor application approved', data: doctorProfile });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to approve application', error: error.message });
    }
};

const rejectDoctorApplication = async (req, res) => {
    try {
        const doctorProfile = await getDoctorProfileByIdOrRespond(req.params.doctorId, res);
        if (!doctorProfile) return;
        if (!ensurePendingReviewStatus(doctorProfile, res, 'rejected')) return;

        doctorProfile.verificationStatus = 'rejected';
        doctorProfile.verificationNotes = req.body.verificationNotes || undefined;
        doctorProfile.verifiedAt = new Date();
        doctorProfile.verifiedBy = req.user.id;

        await doctorProfile.save();
        return res.status(200).json({ success: true, message: 'Doctor application rejected', data: doctorProfile });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to reject application', error: error.message });
    }
};

const getPatientReports = async (req, res) => {
    try {
        const { patientId } = req.params;
        const patientServiceURL = `http://localhost:5001/api/patients/${patientId}/reports`;
        
        // Pass the JWT token from the current request to the Patient Service
        const config = { headers: { Authorization: req.headers.authorization } };
        const response = await axios.get(patientServiceURL, config);

        return res.status(200).json({ success: true, message: 'Patient reports fetched successfully', data: response.data });
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ success: false, message: 'No reports found for this patient' });
        }
        return res.status(500).json({ success: false, message: 'Error communicating with Patient Service', error: error.message });
    }
};

const issuePrescription = async (req, res) => {
    try {
        const { patientId, prescriptionText } = req.body;
        if (!patientId || !prescriptionText) {
            return res.status(400).json({ success: false, message: 'Patient ID and prescription text are required' });
        }

        // Find the doctor based on the logged-in user (req.user.id) rather than URL params
        const doctor = await Doctor.findOneAndUpdate(
            { userId: req.user.id, isActive: true, verificationStatus: 'approved' },
            { $push: { digitalPrescriptions: { patientId, prescriptionText } } },
            { new: true, runValidators: true }
        );

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Approved/Active doctor profile not found' });
        }

        return res.status(201).json({ success: true, message: 'Prescription issued successfully', data: doctor.digitalPrescriptions });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

const disableDoctorProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findOneAndUpdate(
            { userId: req.user.id },
            { isActive: false, availability: [] },
            { new: true }
        );

        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

        return res.status(200).json({ success: true, message: 'Doctor profile disabled successfully', data: doctor });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

module.exports = {
    applyDoctorProfile,
    getMyDoctorProfile,
    updateMyDoctorProfile,
    getPendingDoctorApplications,
    getDoctorApplicationById,
    approveDoctorApplication,
    rejectDoctorApplication,
    getPatientReports,
    issuePrescription,
    disableDoctorProfile
};