import { getAuthToken } from './session';
import { getRuntimeConfigValue } from './runtimeConfig';

const AUTH_BASE_URL = getRuntimeConfigValue('REACT_APP_AUTH_API_URL', 'http://localhost:5001/api');
const PATIENT_BASE_URL = getRuntimeConfigValue('REACT_APP_PATIENT_API_URL', 'http://localhost:5004/api');
const DOCTOR_BASE_URL = getRuntimeConfigValue('REACT_APP_DOCTOR_API_URL', 'http://localhost:5002/api');
const APPOINTMENT_BASE_URL = getRuntimeConfigValue('REACT_APP_APPOINTMENT_API_URL', 'http://localhost:5003/api');
const AI_BASE_URL = getRuntimeConfigValue('REACT_APP_AI_API_URL', 'http://localhost:5005/api');
const PAYMENT_BASE_URL = getRuntimeConfigValue('REACT_APP_PAYMENT_API_URL', 'http://localhost:5006/api');
const NOTIFICATION_BASE_URL = getRuntimeConfigValue(
  'REACT_APP_NOTIFICATION_API_URL',
  'http://localhost:5007/api'
);

const _originalFetch = window.fetch;
window.fetch = async (url, options) => {
  if (typeof url === 'string' && !url.includes('localhost:500')) return _originalFetch(url, options);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await _originalFetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      const overrideUrl = typeof url === 'string' ? url : 'unknown API';
      throw new Error(`API Connection Timeout: The backend service at ${overrideUrl} is not responding. Please verify your backend server and Database connection.`);
    }
    throw error;
  }
};

const buildHeaders = (extraHeaders = {}) => {
  const token = getAuthToken();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders
  };
};

const parseResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
};

export const registerUser = async (formData) => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });

  return parseResponse(response);
};

export const registerDoctor = async (userData) => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/doctors/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  return parseResponse(response);
};

export const loginUser = async (formData) => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });

  return parseResponse(response);
};

export const fetchCurrentUser = async () => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/me`, {
    headers: buildHeaders()
  });

  return parseResponse(response);
};

export const fetchAllUsers = async () => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/users`, {
    headers: buildHeaders()
  });

  return parseResponse(response);
};

export const updateUserRole = async (userId, role) => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/users/${userId}/role`, {
    method: 'PUT',
    headers: buildHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ role })
  });

  return parseResponse(response);
};

export const verifyAuthDoctor = async (userId) => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/users/${userId}/verify-doctor`, {
    method: 'PATCH',
    headers: buildHeaders()
  });
  return parseResponse(response);
};

export const rejectAuthDoctor = async (userId) => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/users/${userId}/reject-doctor`, {
    method: 'PATCH',
    headers: buildHeaders()
  });
  return parseResponse(response);
};

export const fetchPatientProfile = async (userId) => {
  const response = await fetch(`${PATIENT_BASE_URL}/patients/profile/${userId}`, {
    headers: buildHeaders()
  });

  return parseResponse(response);
};

export const createPatientProfile = async (profileData) => {
  const response = await fetch(`${PATIENT_BASE_URL}/patients/profile`, {
    method: 'POST',
    headers: buildHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(profileData)
  });

  return parseResponse(response);
};

export const updatePatientProfile = async (userId, profileData) => {
  const response = await fetch(`${PATIENT_BASE_URL}/patients/profile/${userId}`, {
    method: 'PUT',
    headers: buildHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(profileData)
  });

  return parseResponse(response);
};

export const checkSymptoms = async (symptoms) => {
  const response = await fetch(`${AI_BASE_URL}/ai/check-symptoms`, {
    method: 'POST',
    headers: buildHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ symptoms })
  });

  return parseResponse(response);
};

export const createCheckoutSession = async ({ appointmentId, amount, currency = 'usd' }) => {
  const response = await fetch(`${PAYMENT_BASE_URL}/payments/checkout`, {
    method: 'POST',
    headers: buildHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ appointmentId, amount, currency })
  });

  return parseResponse(response);
};

export const sendNotification = async ({ patientEmail, message }) => {
  const response = await fetch(`${NOTIFICATION_BASE_URL}/notifications/send`, {
    method: 'POST',
    headers: buildHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ patientEmail, message })
  });

  return parseResponse(response);
};

// ── Doctor Service ──────────────────────────────────────────────────────────

export const fetchMyDoctorProfile = async () => {
  const response = await fetch(`${DOCTOR_BASE_URL}/doctors/me`, {
    headers: buildHeaders()
  });
  return parseResponse(response);
};

export const applyDoctorProfile = async (profileData) => {
  const response = await fetch(`${DOCTOR_BASE_URL}/doctors/apply`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(profileData)
  });
  return parseResponse(response);
};

export const updateMyDoctorProfile = async (profileData) => {
  const response = await fetch(`${DOCTOR_BASE_URL}/doctors/me`, {
    method: 'PUT',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(profileData)
  });
  return parseResponse(response);
};

export const fetchAllDoctors = async () => {
  const response = await fetch(`${DOCTOR_BASE_URL}/doctors`, {
    headers: buildHeaders()
  });
  return parseResponse(response);
};

export const fetchPendingDoctorApplications = async () => {
  const response = await fetch(`${DOCTOR_BASE_URL}/doctors/pending`, {
    headers: buildHeaders()
  });
  return parseResponse(response);
};

export const approveDoctorApplication = async ({ doctorId, verificationNotes }) => {
  const response = await fetch(`${DOCTOR_BASE_URL}/doctors/${doctorId}/approve`, {
    method: 'PATCH',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ verificationNotes })
  });
  return parseResponse(response);
};

export const rejectDoctorApplication = async ({ doctorId, verificationNotes }) => {
  const response = await fetch(`${DOCTOR_BASE_URL}/doctors/${doctorId}/reject`, {
    method: 'PATCH',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ verificationNotes })
  });
  return parseResponse(response);
};

export const issuePrescription = async (prescriptionData) => {
  const response = await fetch(`${DOCTOR_BASE_URL}/doctors/prescriptions`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(prescriptionData)
  });
  return parseResponse(response);
};

// ── Appointment Service ─────────────────────────────────────────────────────

export const fetchPatientAppointments = async () => {
  const response = await fetch(`${APPOINTMENT_BASE_URL}/appointments/patient/me`, {
    headers: buildHeaders()
  });
  return parseResponse(response);
};

export const fetchDoctorAppointments = async () => {
  const response = await fetch(`${APPOINTMENT_BASE_URL}/appointments/doctor/me`, {
    headers: buildHeaders()
  });
  return parseResponse(response);
};

export const createAppointment = async (appointmentData) => {
  const response = await fetch(`${APPOINTMENT_BASE_URL}/appointments`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(appointmentData)
  });
  return parseResponse(response);
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await fetch(`${APPOINTMENT_BASE_URL}/appointments/${appointmentId}/status`, {
    method: 'PUT',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status })
  });
  return parseResponse(response);
};

export const cancelAppointment = async (appointmentId) => {
  const response = await fetch(`${APPOINTMENT_BASE_URL}/appointments/${appointmentId}/cancel`, {
    method: 'PUT',
    headers: buildHeaders()
  });
  return parseResponse(response);
};
