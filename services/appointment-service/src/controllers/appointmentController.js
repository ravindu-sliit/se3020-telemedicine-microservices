const Appointment = require('../models/Appointment');
const { v4: uuidv4 } = require('uuid');

// @desc    Create a new appointment request
// @route   POST /api/appointments
const createAppointment = async (req, res) => {
    try {
        // Updated to match new schema: appointmentDate instead of date
        const { doctorId, appointmentDate, timeSlot, patientName, doctorName } = req.body;
        const patientId = req.user.id; // From Binoth's auth middleware

        if (!doctorId || !appointmentDate || !timeSlot) {
            return res.status(400).json({ success: false, message: 'Please provide doctorId, appointmentDate, and timeSlot' });
        }

        const newAppointment = await Appointment.create({
            patientId,
            doctorId,
            patientName,
            doctorName,
            appointmentDate,
            timeSlot,
            status: 'Pending',
            paymentStatus: 'Unpaid' // Default added per new schema
        });

        res.status(201).json({ 
            success: true,
            message: 'Appointment requested successfully', 
            data: newAppointment 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update appointment status (Accept or Reject)
// @route   PUT /api/appointments/:id/status
const updateAppointmentStatus = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { status } = req.body; 

        // Updated to match new schema enums
        const validStatuses = ['Confirmed', 'Cancelled', 'Completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status update' });
        }

        let updateData = { status: status };

        // If the doctor confirms the appointment, generate the full Jitsi Meeting URL
        if (status === 'Confirmed') {
            updateData.videoMeetingUrl = `https://meet.jit.si/Consultation-${appointmentId}-${uuidv4()}`;
        }

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        res.status(200).json({ 
            success: true,
            message: `Appointment successfully marked as ${status.toLowerCase()}`, 
            data: appointment 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all appointments for the logged-in patient
// @route   GET /api/appointments/patient/me
const getPatientAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.user.id })
            .sort({ appointmentDate: 1, timeSlot: 1 }); // Updated to appointmentDate

        res.status(200).json({
            success: true,
            message: 'Patient appointments fetched successfully',
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all appointments for the logged-in doctor
// @route   GET /api/appointments/doctor/me
const getDoctorAppointments = async (req, res) => {
    try {
        // Security Upgrade: Fetch by logged-in doctor's token ID, not a URL parameter
        const appointments = await Appointment.find({ doctorId: req.user.id })
            .sort({ appointmentDate: 1, timeSlot: 1 });

        res.status(200).json({
            success: true,
            message: 'Doctor appointments fetched successfully',
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Cancel an appointment (Patient action)
// @route   PUT /api/appointments/:id/cancel
const cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointment.patientId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
        }

        if (appointment.status === 'Completed' || appointment.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Cannot cancel this appointment' });
        }

        // Updated spelling to match new schema ('Cancelled' with two L's)
        appointment.status = 'Cancelled'; 
        await appointment.save();

        res.status(200).json({ 
            success: true,
            message: 'Appointment cancelled successfully', 
            data: appointment 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Reschedule an appointment (Patient action)
// @route   PUT /api/appointments/:id/reschedule
const rescheduleAppointment = async (req, res) => {
    try {
        const { newAppointmentDate, newTimeSlot } = req.body; // Updated to newAppointmentDate

        if (!newAppointmentDate || !newTimeSlot) {
            return res.status(400).json({ success: false, message: 'Please provide new appointment date and time slot' });
        }

        const existingAppointment = await Appointment.findById(req.params.id);
        if (!existingAppointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
        
        if (existingAppointment.patientId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to reschedule this appointment' });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { 
                appointmentDate: newAppointmentDate, 
                timeSlot: newTimeSlot,
                status: 'Pending' 
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({ 
            success: true,
            message: 'Appointment rescheduled successfully', 
            data: appointment 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

module.exports = {
    createAppointment,
    updateAppointmentStatus,
    getPatientAppointments,
    getDoctorAppointments,
    cancelAppointment,
    rescheduleAppointment
};