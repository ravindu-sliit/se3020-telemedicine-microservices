const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: { 
        type: String, 
        required: true 
    },
    doctorId: { 
        type: String, 
        required: true 
    },
    date: { 
        type: Date, 
        required: true 
    },
    timeSlot: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Canceled'], 
        default: 'Pending' 
    },
    meetingRoom: { 
        type: String, // This is where you will store the Jitsi room name later
        default: null
    },
    reasonForVisit: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);