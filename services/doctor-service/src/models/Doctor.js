const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    specialty: {
      type: String,
      required: true,
      trim: true
    },
    qualifications: {
      type: [String],
      default: []
    },
    medicalLicenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    consultationFee: {
      type: Number,
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    availability: [
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
        },
        isBooked: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Doctor', doctorSchema);