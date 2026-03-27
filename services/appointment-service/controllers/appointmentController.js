const Appointment = require('../models/Appointment');

// @desc    Update appointment status (Accept or Reject)
// @route   PUT /api/appointments/:id/status
const updateAppointmentStatus = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { status } = req.body; // Expecting { "status": "Accepted" } or { "status": "Rejected" }

        // 1. Validate the input
        const validStatuses = ['Accepted', 'Rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status update' });
        }

        // 2. Find and update the appointment in MongoDB
        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { status: status },
            { new: true, runValidators: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // 3. (Optional but recommended) Trigger Notification Service here
        // If status is 'Accepted', you will eventually make an API call to Soori's Notification Service 
        // to send an SMS/Email to the patient.

        // 4. Send success response
        res.status(200).json({ 
            message: `Appointment successfully ${status.toLowerCase()}`, 
            appointment 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { updateAppointmentStatus };