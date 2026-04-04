import { getAuthToken } from './session';

const AUTH_BASE_URL = process.env.REACT_APP_AUTH_API_URL || 'http://localhost:5001/api';
const PATIENT_BASE_URL = process.env.REACT_APP_PATIENT_API_URL || 'http://localhost:5002/api';

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
