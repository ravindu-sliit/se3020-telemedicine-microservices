const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  {
    _id: false
  }
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  {
    _id: false
  }
);

const patientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    address: {
      type: addressSchema,
      default: {}
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: {
      type: [String],
      default: []
    },
    chronicConditions: {
      type: [String],
      default: []
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
