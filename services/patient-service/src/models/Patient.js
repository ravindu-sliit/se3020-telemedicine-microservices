const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
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
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    contactNumber: {
      type: String,
      trim: true
    },
    medicalReports: [
      {
        reportName: {
          type: String,
          trim: true
        },
        fileUrl: {
          type: String,
          trim: true
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    allergies: {
      type: [String],
      default: []
    },
    userId: {
      type: String,
      trim: true
    },
    fullName: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    emergencyContact: {
      type: String,
      trim: true
    },
    medicalHistory: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Patient', patientSchema);
