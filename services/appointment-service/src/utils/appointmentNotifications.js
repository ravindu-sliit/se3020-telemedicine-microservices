const trimTrailingSlash = (value, fallback) => String(value || fallback).replace(/\/+$/, '');

const AUTH_SERVICE_BASE_URL = trimTrailingSlash(
  process.env.AUTH_SERVICE_BASE_URL,
  'http://auth-service:5001/api'
);
const PATIENT_SERVICE_BASE_URL = trimTrailingSlash(
  process.env.PATIENT_SERVICE_BASE_URL,
  'http://patient-service:5002/api'
);
const NOTIFICATION_API_URL = trimTrailingSlash(
  process.env.NOTIFICATION_API_URL,
  'http://notification-service:5007/api/notifications/send'
);

const buildHeaders = (authHeader) => {
  const headers = {};
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  return headers;
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || payload.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

const formatAppointmentDateTime = (appointment) => {
  const datePart = appointment?.appointmentDate ? new Date(appointment.appointmentDate) : null;

  if (!datePart || Number.isNaN(datePart.getTime())) {
    return {
      dateText: 'the scheduled date',
      timeText: appointment?.timeSlot || 'the scheduled time'
    };
  }

  return {
    dateText: datePart.toLocaleDateString(),
    timeText: appointment?.timeSlot || 'the scheduled time'
  };
};

const buildNotificationMessage = ({ appointment, eventType, recipientType }) => {
  const { dateText, timeText } = formatAppointmentDateTime(appointment);
  const doctorName = appointment?.doctorName || 'your doctor';
  const patientName = appointment?.patientName || 'the patient';

  if (recipientType === 'patient') {
    if (eventType === 'created') {
      return `Your appointment with ${doctorName} has been created for ${dateText} at ${timeText}. Current status: Pending.`;
    }

    if (eventType === 'confirmed') {
      return `Your appointment with ${doctorName} has been confirmed for ${dateText} at ${timeText}.`;
    }

    if (eventType === 'rescheduled') {
      return `Your appointment with ${doctorName} has been rescheduled to ${dateText} at ${timeText}. Current status: Pending.`;
    }

    return `Your appointment with ${doctorName} for ${dateText} at ${timeText} has been cancelled.`;
  }

  if (eventType === 'created') {
    return `A new appointment request from ${patientName} has been created for ${dateText} at ${timeText}. Current status: Pending.`;
  }

  if (eventType === 'confirmed') {
    return `The appointment with ${patientName} has been confirmed for ${dateText} at ${timeText}.`;
  }

  if (eventType === 'rescheduled') {
    return `The appointment with ${patientName} has been rescheduled to ${dateText} at ${timeText}. Current status: Pending.`;
  }

  return `The appointment with ${patientName} for ${dateText} at ${timeText} has been cancelled.`;
};

const buildNotificationEmailContext = ({ eventType }) => {
  if (eventType === 'created') {
    return {
      notificationType: 'appointment_created',
      subject: 'Appointment Request Received',
      headline: 'Appointment Request Created'
    };
  }

  if (eventType === 'confirmed') {
    return {
      notificationType: 'appointment_confirmed',
      subject: 'Appointment Confirmed',
      headline: 'Appointment Confirmed'
    };
  }

  if (eventType === 'rescheduled') {
    return {
      notificationType: 'appointment_rescheduled',
      subject: 'Appointment Rescheduled',
      headline: 'Appointment Updated'
    };
  }

  return {
    notificationType: 'appointment_cancelled',
    subject: 'Appointment Cancellation Notice',
    headline: 'Appointment Cancelled'
  };
};

const getPatientContactDetails = async ({ authHeader, patientId }) => {
  const [userResult, profileResult] = await Promise.allSettled([
    fetchJson(`${AUTH_SERVICE_BASE_URL}/auth/me`, {
      headers: buildHeaders(authHeader)
    }),
    fetchJson(`${PATIENT_SERVICE_BASE_URL}/patients/profile/${patientId}`, {
      headers: buildHeaders(authHeader)
    })
  ]);

  const user = userResult.status === 'fulfilled' ? userResult.value?.data || {} : {};
  const profile = profileResult.status === 'fulfilled' ? profileResult.value?.data || {} : {};

  return {
    email: user.email || '',
    phone: profile.phone || profile.contactNumber || '',
    name: user.fullName || profile.fullName || 'Patient'
  };
};

const getDoctorContactDetails = async ({ authHeader, doctorId }) => {
  try {
    const response = await fetchJson(`${AUTH_SERVICE_BASE_URL}/auth/doctors/verified`, {
      headers: buildHeaders(authHeader)
    });

    const doctors = Array.isArray(response?.data) ? response.data : [];
    const doctor = doctors.find((entry) => String(entry.id) === String(doctorId));

    if (!doctor) {
      return { email: '', name: 'Doctor' };
    }

    return {
      email: doctor.email || '',
      name: doctor.fullName || 'Doctor'
    };
  } catch (_error) {
    return { email: '', name: 'Doctor' };
  }
};

const sendNotification = async ({ recipientEmail = '', recipientPhone = '', message, emailContext }) => {
  if (!message || (!recipientEmail && !recipientPhone)) {
    return {
      success: false,
      skipped: true,
      reason: 'No recipient contact details available.'
    };
  }

  const response = await fetch(NOTIFICATION_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      patientEmail: recipientEmail,
      patientPhone: recipientPhone,
      message,
      ...(emailContext || {})
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || payload.error || 'Notification delivery failed');
  }

  return payload;
};

const sendAppointmentNotifications = async ({ authHeader, appointment, eventType }) => {
  const [patientContact, doctorContact] = await Promise.all([
    getPatientContactDetails({ authHeader, patientId: appointment.patientId }),
    getDoctorContactDetails({ authHeader, doctorId: appointment.doctorId })
  ]);

  const recipientRequests = [
    {
      recipientType: 'patient',
      recipientEmail: patientContact.email,
      recipientPhone: patientContact.phone
    },
    {
      recipientType: 'doctor',
      recipientEmail: doctorContact.email,
      recipientPhone: ''
    }
  ];

  const results = [];

  for (const recipient of recipientRequests) {
    const emailContext = buildNotificationEmailContext({ eventType });
    const message = buildNotificationMessage({
      appointment,
      eventType,
      recipientType: recipient.recipientType
    });

    try {
      const response = await sendNotification({
        recipientEmail: recipient.recipientEmail,
        recipientPhone: recipient.recipientPhone,
        message,
        emailContext
      });

      results.push({
        recipientType: recipient.recipientType,
        status: 'sent',
        response
      });
    } catch (error) {
      results.push({
        recipientType: recipient.recipientType,
        status: 'failed',
        error: error.message || 'Notification delivery failed'
      });
    }
  }

  return results;
};

module.exports = {
  sendAppointmentNotifications,
  buildNotificationMessage,
  getPatientContactDetails,
  getDoctorContactDetails
};