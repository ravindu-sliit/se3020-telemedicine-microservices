const Appointment = require('../models/Appointment');
const { v4: uuidv4 } = require('uuid');

// @desc    Create a new appointment request
// @route   POST /api/appointments
const createAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, date, timeSlot, reasonForVisit } = req.body;

        // 1. Basic validation
        if (!patientId || !doctorId || !date || !timeSlot) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // 2. Optional but highly recommended: Make a quick GET request to your Doctor Service
        // to verify that the doctor actually exists and that the timeSlot is in their availability array!

        // 3. Create the appointment in the database
        const newAppointment = await Appointment.create({
            patientId,
            doctorId,
            date,
            timeSlot,
            reasonForVisit,
            status: 'Pending' // Always starts as pending until the doctor accepts it
        });

        // 4. TODO: Trigger Soori's Notification Service here

        res.status(201).json({ 
            message: 'Appointment requested successfully', 
            appointment: newAppointment 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update appointment status (Accept or Reject)
// @route   PUT /api/appointments/:id/status
const updateAppointmentStatus = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { status } = req.body; 

        const validStatuses = ['Accepted', 'Rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status update' });
        }

        let updateData = { status: status };

        // If the doctor accepts the appointment, generate the Jitsi Room Name!
        if (status === 'Accepted') {
            // Creates a unique string like "Consultation-69dcb561-123e4567-e89b-12d3"
            updateData.meetingRoom = `Consultation-${appointmentId}-${uuidv4()}`;
        }

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.status(200).json({ 
            message: `Appointment successfully ${status.toLowerCase()}`, 
            appointment 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all appointments for a specific patient
// @route   GET /api/appointments/patient/:patientId
const getPatientAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.params.patientId })
            .sort({ date: 1, timeSlot: 1 }); // Sorts by date and time

        res.status(200).json({
            message: 'Patient appointments fetched successfully',
            count: appointments.length,
            appointments
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all appointments for a specific doctor
// @route   GET /api/appointments/doctor/:doctorId
const getDoctorAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctorId: req.params.doctorId })
            .sort({ date: 1, timeSlot: 1 });

        res.status(200).json({
            message: 'Doctor appointments fetched successfully',
            count: appointments.length,
            appointments
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Cancel an appointment (Patient action)
// @route   PUT /api/appointments/:id/cancel
const cancelAppointment = async (req, res) => {
    try {
        const appointmentId = req.params.id;

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Only allow cancellation if it hasn't already been completed
        if (appointment.status === 'Completed') {
            return res.status(400).json({ message: 'Cannot cancel a completed appointment' });
        }

        appointment.status = 'Canceled'; // Note: You may need to add 'Canceled' to your schema's enum array!
        await appointment.save();

        // TODO: Trigger Notification Service to email the doctor about the cancellation

        res.status(200).json({ 
            message: 'Appointment canceled successfully', 
            appointment 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Reschedule an appointment (Patient action)
// @route   PUT /api/appointments/:id/reschedule
const rescheduleAppointment = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { newDate, newTimeSlot } = req.body;

        if (!newDate || !newTimeSlot) {
            return res.status(400).json({ message: 'Please provide new date and time slot' });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { 
                date: newDate, 
                timeSlot: newTimeSlot,
                status: 'Pending' // Rescheduling sets it back to pending for the doctor to re-approve
            },
            { new: true, runValidators: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.status(200).json({ 
            message: 'Appointment rescheduled successfully', 
            appointment 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
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