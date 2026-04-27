/**
 * @file appointmentController.js
 * @description Handles core business logic for the Appointment Microservice,
 * including booking, status management, and patient/doctor queue retrieval.
 * Video consultation sessions are delegated to the Telemedicine Microservice.
 */

const Appointment = require('../models/Appointment');
const { sendAppointmentNotifications } = require('../utils/appointmentNotifications');

const TELEMEDICINE_API_URL =
  process.env.TELEMEDICINE_API_URL || 'http://telemedicine-service:5008/api/telemedicine';

/**
 * Request a secure video session from the Telemedicine Microservice.
 * Forwards the doctor's Bearer token so the remote service can authorize.
 * Returns the meeting URL on success, or null if the call fails
 * (the appointment is still confirmed — frontend shows "Meeting Link Not Ready").
 */
const requestVideoSession = async ({ appointmentId, patientId, doctorId, authHeader }) => {
  try {
    const response = await fetch(`${TELEMEDICINE_API_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
      },
      body: JSON.stringify({ appointmentId, patientId, doctorId })
    });

    if (!response.ok) {
      console.error(
        `Telemedicine session creation failed (${response.status}) for appointment ${appointmentId}`
      );
      return null;
    }

    const payload = await response.json();
    return payload?.data?.videoMeetingUrl || null;
  } catch (error) {
    console.error('Telemedicine service call failed:', error.message);
    return null;
  }
};

/**
 * @desc    Create a new appointment request
 * @route   POST /api/appointments
 * @access  Private (Patient role required)
 */
const createAppointment = async (req, res) => {
    try {
        const { doctorId, appointmentDate, timeSlot, patientName, doctorName } = req.body;
        
        // Security: Extract patientId directly from the validated JWT token
        // This prevents a user from spoofing an appointment for someone else.
        const patientId = req.user.id; 

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
            status: 'Pending', // Appointments always start as pending until doctor review
            paymentStatus: 'Unpaid' 
        });

        const notificationResults = await sendAppointmentNotifications({
            authHeader: req.headers.authorization,
            appointment: newAppointment,
            eventType: 'created'
        });

        res.status(201).json({ 
            success: true,
            message: 'Appointment requested successfully', 
            data: newAppointment,
            notifications: notificationResults
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Update appointment status (Confirm, Cancel, or Complete)
 * @route   PUT /api/appointments/:id/status
 * @access  Private (Doctor role required)
 */
const updateAppointmentStatus = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { status } = req.body; 

        // Validate that the incoming status matches our allowed enums
        const validStatuses = ['Confirmed', 'Cancelled', 'Completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status update' });
        }

        let updateData = { status: status };

        // On confirm, delegate secure video session creation to the Telemedicine Microservice.
        // The appointment document keeps videoMeetingUrl for the frontend, while the
        // authoritative session record lives in the telemedicine-service.
        if (status === 'Confirmed') {
            const existing = await Appointment.findById(appointmentId);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            const videoMeetingUrl = await requestVideoSession({
                appointmentId,
                patientId: existing.patientId,
                doctorId: existing.doctorId,
                authHeader: req.headers.authorization
            });

            if (videoMeetingUrl) {
                updateData.videoMeetingUrl = videoMeetingUrl;
            }
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

/**
 * @desc    Get all appointments for the currently logged-in patient
 * @route   GET /api/appointments/patient/me
 * @access  Private (Patient role required)
 */
const getPatientAppointments = async (req, res) => {
    try {
        // Security: Filter appointments strictly by the JWT user ID
        const appointments = await Appointment.find({ patientId: req.user.id })
            .sort({ appointmentDate: 1, timeSlot: 1 }); // Chronological sorting

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

/**
 * @desc    Get all appointments assigned to the logged-in doctor
 * @route   GET /api/appointments/doctor/me
 * @access  Private (Doctor role required)
 */
const getDoctorAppointments = async (req, res) => {
    try {
        // Security: Filter appointments strictly by the JWT doctor ID
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

/**
 * @desc    Cancel an existing appointment
 * @route   PUT /api/appointments/:id/cancel
 * @access  Private (Patient role required)
 */
const cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Security check: Ensure the patient attempting to cancel actually owns the appointment
        if (appointment.patientId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
        }

        // Business Logic: Prevent cancellation of finalized appointments
        if (appointment.status === 'Completed' || appointment.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Cannot cancel this appointment' });
        }

        appointment.status = 'Cancelled'; 
        await appointment.save();

        const notificationResults = await sendAppointmentNotifications({
            authHeader: req.headers.authorization,
            appointment,
            eventType: 'cancelled'
        });

        res.status(200).json({ 
            success: true,
            message: 'Appointment cancelled successfully', 
            data: appointment,
            notifications: notificationResults
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Reschedule an existing appointment
 * @route   PUT /api/appointments/:id/reschedule
 * @access  Private (Patient role required)
 */
const rescheduleAppointment = async (req, res) => {
    try {
        const { newAppointmentDate, newTimeSlot } = req.body; 

        if (!newAppointmentDate || !newTimeSlot) {
            return res.status(400).json({ success: false, message: 'Please provide new appointment date and time slot' });
        }

        const existingAppointment = await Appointment.findById(req.params.id);
        if (!existingAppointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
        
        // Security check: Ensure ownership before modifying
        if (existingAppointment.patientId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to reschedule this appointment' });
        }

        // Apply new times and reset status to Pending for doctor re-approval
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { 
                appointmentDate: newAppointmentDate, 
                timeSlot: newTimeSlot,
                status: 'Pending' 
            },
            { new: true, runValidators: true }
        );

        const notificationResults = await sendAppointmentNotifications({
            authHeader: req.headers.authorization,
            appointment,
            eventType: 'rescheduled'
        });

        res.status(200).json({ 
            success: true,
            message: 'Appointment rescheduled successfully', 
            data: appointment,
            notifications: notificationResults
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