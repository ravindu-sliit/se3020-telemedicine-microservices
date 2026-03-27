const Doctor = require('../models/Doctor');

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

module.exports = {
    getDoctorProfile,
    updateAvailability
};