/**
 * @file telemedicineController.js
 * @description Handles secure video consultation session management.
 * Generates unguessable Jitsi Meet room URLs and tracks session lifecycle.
 */

const { randomUUID } = require('crypto');
const VideoSession = require('../models/VideoSession');
const env = require('../config/env');

/**
 * @desc    Create (or return existing) a secure video session for an appointment
 * @route   POST /api/telemedicine/sessions
 * @access  Private (Doctor role required)
 */
const createSession = async (req, res) => {
  try {
    const { appointmentId, patientId, doctorId } = req.body;

    if (!appointmentId || !patientId || !doctorId) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId, patientId, and doctorId are required'
      });
    }

    // Idempotent: if a session already exists for this appointment, return it
    const existing = await VideoSession.findOne({ appointmentId });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Video session already exists',
        data: existing
      });
    }

    // Unguessable room name derived from appointment + random UUID
    const roomName = `Consultation-${appointmentId}-${randomUUID()}`;
    const videoMeetingUrl = `${env.jitsiBaseUrl}/${roomName}`;

    const session = await VideoSession.create({
      appointmentId,
      patientId,
      doctorId,
      roomName,
      videoMeetingUrl,
      provider: 'jitsi',
      status: 'Scheduled'
    });

    return res.status(201).json({
      success: true,
      message: 'Video session created successfully',
      data: session
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * @desc    Get the video session for a given appointment
 * @route   GET /api/telemedicine/sessions/:appointmentId
 * @access  Private (Patient or Doctor)
 */
const getSessionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const session = await VideoSession.findOne({ appointmentId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Video session not found for this appointment'
      });
    }

    // Authorize: only the assigned patient or doctor may access
    const userId = req.user.id;
    const role = req.user.role;
    const isParticipant =
      (role === 'patient' && session.patientId === userId) ||
      (role === 'doctor' && session.doctorId === userId);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this session'
      });
    }

    return res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

/**
 * @desc    Update session lifecycle status (Active on join, Ended on leave)
 * @route   PUT /api/telemedicine/sessions/:appointmentId/status
 * @access  Private (Patient or Doctor participant)
 */
const updateSessionStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Active', 'Ended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session status'
      });
    }

    const session = await VideoSession.findOne({ appointmentId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Video session not found'
      });
    }

    const userId = req.user.id;
    const role = req.user.role;
    const isParticipant =
      (role === 'patient' && session.patientId === userId) ||
      (role === 'doctor' && session.doctorId === userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this session'
      });
    }

    session.status = status;
    if (status === 'Active' && !session.startedAt) session.startedAt = new Date();
    if (status === 'Ended') session.endedAt = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      message: `Session marked as ${status.toLowerCase()}`,
      data: session
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  createSession,
  getSessionByAppointment,
  updateSessionStatus
};
