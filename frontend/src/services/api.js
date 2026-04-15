import { getAuthToken } from './session';
import { getRuntimeConfigValue } from './runtimeConfig';

const AUTH_BASE_URL = getRuntimeConfigValue('REACT_APP_AUTH_API_URL', 'http://localhost:5001/api');
const PATIENT_BASE_URL = getRuntimeConfigValue('REACT_APP_PATIENT_API_URL', 'http://localhost:5002/api');
const AI_BASE_URL = getRuntimeConfigValue('REACT_APP_AI_API_URL', 'http://localhost:5005/api');
const PAYMENT_BASE_URL = getRuntimeConfigValue('REACT_APP_PAYMENT_API_URL', 'http://localhost:5006/api');
const NOTIFICATION_BASE_URL = getRuntimeConfigValue(
  'REACT_APP_NOTIFICATION_API_URL',
  'http://localhost:5007/api'
);

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
