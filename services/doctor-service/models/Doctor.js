const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        unique: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    specialty: { 
        type: String, 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
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