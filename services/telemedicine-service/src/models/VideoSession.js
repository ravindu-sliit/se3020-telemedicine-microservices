const mongoose = require('mongoose');

const videoSessionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      trim: true
    },
    doctorId: {
      type: String,
      required: true,
      trim: true
    },
    roomName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    videoMeetingUrl: {
      type: String,
      required: true,
      trim: true
    },
    provider: {
      type: String,
      enum: ['jitsi'],
      default: 'jitsi'
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Active', 'Ended'],
      default: 'Scheduled'
    },
    startedAt: { type: Date },
    endedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('VideoSession', videoSessionSchema);
