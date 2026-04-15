const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: {
      type: String,
      trim: true
    },
    endTime: {
      type: String,
      trim: true
    }
  },
  {
    _id: false
  }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      trim: true
    },
    specialty: {
      type: String,
      required: [true, 'Specialty is required'],
      trim: true
    },
    qualifications: {
      type: [String],
      default: []
    },
    medicalLicenseNumber: {
      type: String,
      required: [true, 'Medical license number is required'],
      unique: true,
      trim: true
    },
    yearsOfExperience: {
      type: Number,
      min: 0
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Consultation fee must be a positive number']
    },
    bio: {
      type: String,
      trim: true
    },
    availability: {
      type: [availabilitySchema],
      default: []
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    verificationNotes: {
      type: String,
      trim: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    verifiedAt: {
      type: Date
    },
    verifiedBy: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Doctor', doctorSchema);
