const Doctor = require('../models/Doctor');
const axios = require('axios');

// @desc    Create a new doctor profile (After Auth Registration)
// @route   POST /api/doctors
const createDoctorProfile = async (req, res) => {
    try {
        const { userId, name, specialty } = req.body;

        // 1. Check if a profile already exists for this Auth User
        const doctorExists = await Doctor.findOne({ userId });
        if (doctorExists) {
            return res.status(400).json({ message: 'Doctor profile already exists' });
        }

        // 2. Create the new doctor profile
        const doctor = await Doctor.create({
            userId,      // This MUST match the ID from Binoth's Auth Service
            name,
            specialty,
            availability: [], // Starts empty
            digitalPrescriptions: [] // Starts empty
        });

        res.status(201).json({
            message: 'Doctor profile created successfully',
            doctor
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get doctor profile
// @route   GET /api/doctors/:id
const getDoctorProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.status(200).json(doctor);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update doctor availability
// @route   PUT /api/doctors/:id/availability
const updateAvailability = async (req, res) => {
    try {
        const { date, timeSlots } = req.body;
        
        // Find the doctor and push the new availability into the array
        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            { $push: { availability: { date, timeSlots } } },
            { new: true, runValidators: true }
        );

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.status(200).json({ message: 'Availability updated successfully', doctor });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Disable (Soft Delete) a doctor profile
// @route   PUT /api/doctors/:id/disable
const disableDoctorProfile = async (req, res) => {
    try {
        // 1. Find the doctor and set isActive to false
        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // 2. Clear out their future availability so patients can't book them anymore
        doctor.availability = [];
        await doctor.save();

        res.status(200).json({ message: 'Doctor profile disabled successfully', doctor });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Issue a digital prescription to a patient
// @route   POST /api/doctors/:id/prescriptions
const issuePrescription = async (req, res) => {
    try {
        const { patientId, prescriptionText } = req.body;

        if (!patientId || !prescriptionText) {
            return res.status(400).json({ message: 'Patient ID and prescription text are required' });
        }

        // Find the doctor and push the new prescription into their array
        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            { 
                $push: { 
                    digitalPrescriptions: { patientId, prescriptionText } 
                } 
            },
            { new: true, runValidators: true }
        );

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // In a fully connected system, you might also trigger a request to the 
        // Patient Service here to save the prescription to the Patient's profile!

        res.status(201).json({ 
            message: 'Prescription issued successfully', 
            digitalPrescriptions: doctor.digitalPrescriptions 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get medical reports for a specific patient
// @route   GET /api/doctors/:id/patients/:patientId/reports
const getPatientReports = async (req, res) => {
    try {
        const { id, patientId } = req.params;

        // 1. Verify the doctor actually exists
        const doctor = await Doctor.findById(id);
        if (!doctor || !doctor.isActive) {
            return res.status(404).json({ message: 'Doctor not found or inactive' });
        }

        // 2. Define the URL for Binoth's Patient Service
        // You and Binoth must agree on this URL structure!
        const patientServiceURL = `http://localhost:5001/api/patients/${patientId}/reports`;

        // 3. Make the Service-to-Service call
        const response = await axios.get(patientServiceURL);

        // 4. Send the reports back to Supethum's React frontend
        res.status(200).json({
            message: 'Patient reports fetched successfully',
            reports: response.data
        });

    } catch (error) {
        // If Binoth's service is down or returns an error, catch it gracefully
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ message: 'No reports found for this patient' });
        }
        res.status(500).json({ message: 'Error communicating with Patient Service', error: error.message });
    }
};

module.exports = {
    createDoctorProfile,
    getDoctorProfile,
    updateAvailability,
    disableDoctorProfile,
    issuePrescription,
    getPatientReports
};