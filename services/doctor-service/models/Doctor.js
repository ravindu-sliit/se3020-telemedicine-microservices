const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        unique: true 
        // This will link to the global auth ID Binoth creates
    },
    name: { 
        type: String, 
        required: true 
    },
    specialty: { 
        type: String, 
        required: true 
    },
    availability: [{
        date: { type: Date },
        timeSlots: [{ type: String }] // e.g., ["09:00", "09:30", "10:00"]
    }],
    digitalPrescriptions: [{
        patientId: { type: String },
        prescriptionText: { type: String },
        dateIssued: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);