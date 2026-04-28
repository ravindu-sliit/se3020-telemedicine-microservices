import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon, UserGroupIcon, DocumentTextIcon,
  CheckCircleIcon, XCircleIcon, VideoCameraIcon,
  Squares2X2Icon,
  ClockIcon, UserCircleIcon, TrashIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../components/DashboardLayout';
import { getRuntimeConfigValue } from '../services/runtimeConfig';
import {
  fetchDoctorAppointments,
  updateAppointmentStatus,
  fetchMyDoctorProfile,
  updateMyDoctorProfile,
  applyDoctorProfile,
  deleteMyAccount,
  fetchPatientProfile,
  fetchPatientReports,
  issuePrescription
} from '../services/api';
import { clearSession, getSession } from '../services/session';

const PATIENT_API_BASE_URL = getRuntimeConfigValue('REACT_APP_PATIENT_API_URL', 'http://localhost:5004/api');
const PATIENT_ASSET_BASE_URL = PATIENT_API_BASE_URL.replace(/\/api\/?$/, '');

const buildReportFileUrl = (report) => {
  if (report?.fileUrl) {
    return report.fileUrl;
  }

  if (report?.fileName) {
    return `${PATIENT_ASSET_BASE_URL}/uploads/${encodeURIComponent(report.fileName)}`;
  }

  if (report?.storagePath) {
    const normalizedPath = String(report.storagePath).replace(/\\/g, '/');
    const fileNameFromPath = normalizedPath.split('/').pop();
    if (fileNameFromPath) {
      return `${PATIENT_ASSET_BASE_URL}/uploads/${encodeURIComponent(fileNameFromPath)}`;
    }
  }

  return '';
};

const parseAppointmentDateTime = (appointment) => {
  if (!appointment?.appointmentDate) {
    return null;
  }

  const date = new Date(appointment.appointmentDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const value = String(appointment.timeSlot || '').trim().toUpperCase();
  if (!value) {
    return date;
  }

  const twelveHourMatch = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (twelveHourMatch) {
    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const period = twelveHourMatch[3];

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  const twentyFourHourMatch = value.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);
    if (hours <= 23 && minutes <= 59) {
      date.setHours(hours, minutes, 0, 0);
    }
    return date;
  }

  return date;
};

const Doctor = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const session = useMemo(() => getSession(), []);
  const navigate = useNavigate();

  // Appointment state
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptError, setApptError] = useState('');
  const [actionState, setActionState] = useState({ id: '', action: '' });
  const [actionFeedback, setActionFeedback] = useState('');

  // Doctor profile state
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState({ type: '', message: '' });
  const [profileForm, setProfileForm] = useState({
    fullName: '', specialty: '', yearsOfExperience: '', medicalLicenseNumber: '',
    consultationFee: '', bio: '', qualifications: '', languages: '', availability: []
  });
  const [reportsByPatient, setReportsByPatient] = useState({});
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [prescriptionDrafts, setPrescriptionDrafts] = useState({});
  const [prescriptionState, setPrescriptionState] = useState({ appointmentId: '', status: '' });
  const [prescriptionFeedback, setPrescriptionFeedback] = useState({ type: '', message: '' });

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Squares2X2Icon },
    { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    { id: 'patients', label: 'Patients', icon: UserGroupIcon },
    { id: 'patient-reports', label: 'Patient Reports', icon: DocumentTextIcon },
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  ];

  const loadAppointments = useCallback(async () => {
    setApptLoading(true);
    setApptError('');
    try {
      const response = await fetchDoctorAppointments();
      const records = Array.isArray(response?.data) ? response.data : [];
      setAppointments(records);
    } catch (error) {
      setApptError(error.message || 'Failed to load appointments.');
      setAppointments([]);
    } finally {
      setApptLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const response = await fetchMyDoctorProfile();
      const data = response?.data || {};
      setProfile(data);
      setProfileForm({
        fullName: data.fullName || session?.user?.fullName || '',
        specialty: data.specialty || '',
        yearsOfExperience: data.yearsOfExperience || '',
        medicalLicenseNumber: data.medicalLicenseNumber || '',
        consultationFee: data.consultationFee || '',
        bio: data.bio || '',
        qualifications: Array.isArray(data.qualifications) ? data.qualifications.join(', ') : '',
        languages: Array.isArray(data.languages) ? data.languages.join(', ') : '',
        availability: Array.isArray(data.availability) ? data.availability : []
      });
    } catch (error) {
      // Profile may not exist yet — that's OK
    } finally {
      setProfileLoading(false);
    }
  }, [session?.user?.fullName]);

  useEffect(() => {
    loadAppointments();
    loadProfile();
  }, [loadAppointments, loadProfile]);

  const handleAppointmentAction = async (id, action) => {
    setActionState({ id, action });
    setActionFeedback('');
    try {
      const status = action === 'accept' ? 'Confirmed' : 'Cancelled';
      await updateAppointmentStatus(id, status);
      setActionFeedback(`Appointment ${action === 'accept' ? 'confirmed' : 'rejected'} successfully.`);
      await loadAppointments();
    } catch (error) {
      setActionFeedback(error.message || `Failed to ${action} appointment.`);
    } finally {
      setActionState({ id: '', action: '' });
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(cur => ({ ...cur, [name]: value }));
  };

  const addAvailability = () => {
    setProfileForm(cur => ({
      ...cur,
      availability: [...cur.availability, { dayOfWeek: 'Monday', startTime: '', endTime: '' }]
    }));
  };

  const removeAvailability = (index) => {
    setProfileForm(cur => ({
      ...cur,
      availability: cur.availability.filter((_, i) => i !== index)
    }));
  };

  const updateAvailability = (index, field, value) => {
    setProfileForm(cur => {
      const newAvail = [...cur.availability];
      newAvail[index][field] = value;
      return { ...cur, availability: newAvail };
    });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileFeedback({ type: '', message: '' });
    try {
      const payload = {
        ...profileForm,
        yearsOfExperience: Number(profileForm.yearsOfExperience) || 0,
        consultationFee: Number(profileForm.consultationFee) || 0,
        qualifications: profileForm.qualifications.split(',').map(s => s.trim()).filter(Boolean),
        languages: profileForm.languages.split(',').map(s => s.trim()).filter(Boolean),
        availability: profileForm.availability.filter(a => a.dayOfWeek && a.startTime && a.endTime)
      };
      
      if (!profile || !profile._id) {
        await applyDoctorProfile(payload);
      } else {
        await updateMyDoctorProfile(payload);
      }
      
      setProfileFeedback({ type: 'success', message: 'Profile updated successfully.' });
      await loadProfile();
    } catch (error) {
      setProfileFeedback({ type: 'error', message: error.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const todayAppts = appointments.filter(a => a.appointmentDate && a.appointmentDate.slice(0, 10) === todayStr);
  const pendingAppts = appointments.filter(a => a.status?.toLowerCase() === 'pending');
  const confirmedAppts = appointments.filter(a => a.status?.toLowerCase() === 'confirmed');

  const upcomingMeetingAppts = appointments
    .filter((apt) => {
      const status = apt.status?.toLowerCase();
      if (status !== 'confirmed') return false;

      const appointmentDateTime = parseAppointmentDateTime(apt);
      if (!appointmentDateTime) return false;

      return appointmentDateTime.getTime() > now.getTime();
    })
    .sort((a, b) => {
      const first = parseAppointmentDateTime(a)?.getTime() || 0;
      const second = parseAppointmentDateTime(b)?.getTime() || 0;
      return first - second;
    });

  const ongoingMeetingAppts = appointments
    .filter((apt) => {
      const status = apt.status?.toLowerCase();
      if (status !== 'confirmed') return false;

      const appointmentDateTime = parseAppointmentDateTime(apt);
      if (!appointmentDateTime) return false;

      return appointmentDateTime.getTime() <= now.getTime();
    })
    .sort((a, b) => {
      const first = parseAppointmentDateTime(a)?.getTime() || 0;
      const second = parseAppointmentDateTime(b)?.getTime() || 0;
      return second - first;
    });

  const handleJoinMeeting = (appointment) => {
    if (!appointment?.videoMeetingUrl) {
      return;
    }

    navigate(`/telemedicine-room?appointmentId=${encodeURIComponent(appointment._id)}`, {
      state: { appointment }
    });
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Delete your doctor account? This will remove your login access and cannot be undone.');
    if (!confirmed) return;

    setIsDeletingAccount(true);
    setProfileFeedback({ type: '', message: '' });

    try {
      await deleteMyAccount();
      clearSession();
      window.location.href = '/';
    } catch (error) {
      setProfileFeedback({ type: 'error', message: error.message || 'Failed to delete your account.' });
      setIsDeletingAccount(false);
    }
  };

  const getAppointmentPatientId = (appointment) => {
    if (!appointment) return '';
    if (appointment.patientId && typeof appointment.patientId === 'object') {
      return appointment.patientId._id || appointment.patientId.id || '';
    }
    return appointment.patientUserId || appointment.patientId || '';
  };

  const handlePrescriptionDraftChange = (appointmentId, value) => {
    setPrescriptionDrafts((current) => ({
      ...current,
      [appointmentId]: value
    }));
  };

  const handleIssuePrescription = async (appointment) => {
    const appointmentId = appointment?._id || '';
    if (!appointmentId) return;

    const patientId = String(getAppointmentPatientId(appointment) || '').trim();
    const prescriptionText = String(prescriptionDrafts[appointmentId] || '').trim();

    if (!patientId) {
      setPrescriptionFeedback({ type: 'error', message: 'Unable to resolve patient id for this appointment.' });
      return;
    }

    if (!prescriptionText) {
      setPrescriptionFeedback({ type: 'error', message: 'Please enter prescription details before issuing.' });
      return;
    }

    setPrescriptionState({ appointmentId, status: 'issuing' });
    setPrescriptionFeedback({ type: '', message: '' });

    try {
      await issuePrescription({
        patientId,
        appointmentId,
        prescriptionText
      });
      setPrescriptionFeedback({ type: 'success', message: 'Prescription issued successfully.' });
      setPrescriptionDrafts((current) => ({ ...current, [appointmentId]: '' }));
    } catch (error) {
      setPrescriptionFeedback({ type: 'error', message: error.message || 'Failed to issue prescription.' });
    } finally {
      setPrescriptionState({ appointmentId: '', status: '' });
    }
  };

  const patientsWithAppointments = useMemo(() => {
    const seen = new Set();
    const grouped = [];

    appointments.forEach((appointment) => {
      const patientObject =
        appointment?.patientId && typeof appointment.patientId === 'object'
          ? appointment.patientId
          : null;
      const patientUserId =
        patientObject?._id ||
        patientObject?.id ||
        appointment?.patientUserId ||
        appointment?.patientId ||
        '';
      const patientName = patientObject?.fullName || appointment?.patientName || 'Patient';

      const normalizedId = String(patientUserId || '').trim();
      if (!normalizedId || seen.has(normalizedId)) {
        return;
      }

      seen.add(normalizedId);
      grouped.push({ userId: normalizedId, name: patientName });
    });

    return grouped;
  }, [appointments]);

  const loadPatientReports = useCallback(async () => {
    if (patientsWithAppointments.length === 0) {
      setReportsByPatient({});
      return;
    }

    setReportsLoading(true);
    setReportsError('');

    try {
      const results = await Promise.allSettled(
        patientsWithAppointments.map(async (patient) => {
          // Appointment records store patient user IDs. Reports API expects patient profile ID.
          const profileResponse = await fetchPatientProfile(patient.userId);
          const patientProfileId = profileResponse?.data?._id;
          if (!patientProfileId) {
            throw new Error('Patient profile not found.');
          }

          const response = await fetchPatientReports(patientProfileId);
          const records = Array.isArray(response?.data) ? response.data : [];
          return { patient, records };
        })
      );

      const grouped = {};
      let hasFailed = false;

      results.forEach((result, index) => {
        const patient = patientsWithAppointments[index];
        if (result.status === 'fulfilled') {
          grouped[patient.userId] = {
            patientName: patient.name,
            reports: result.value.records,
            error: ''
          };
          return;
        }

        hasFailed = true;
        grouped[patient.userId] = {
          patientName: patient.name,
          reports: [],
          error: result.reason?.message || 'Failed to load reports for this patient.'
        };
      });

      setReportsByPatient(grouped);
      if (hasFailed) {
        setReportsError('Some patient reports could not be loaded.');
      }
    } catch (error) {
      setReportsByPatient({});
      setReportsError(error.message || 'Failed to load patient reports.');
    } finally {
      setReportsLoading(false);
    }
  }, [patientsWithAppointments]);

  useEffect(() => {
    if (activeTab === 'patient-reports') {
      loadPatientReports();
    }
  }, [activeTab, loadPatientReports]);

  const renderDashboard = () => (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-5" style={{ marginBottom: 32 }}>
        {[
          { label: "Today's Patients", value: String(todayAppts.length), color: '#4f46e5', bg: '#eef2ff', icon: UserGroupIcon },
          { label: 'Pending Requests', value: String(pendingAppts.length), color: '#f59e0b', bg: '#fffbeb', icon: ClockIcon },
          { label: 'Confirmed', value: String(confirmedAppts.length), color: '#10b981', bg: '#ecfdf5', icon: DocumentTextIcon },
          { label: 'Total', value: String(appointments.length), color: '#7c3aed', bg: '#f5f3ff', icon: CheckCircleIcon },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 20, height: 20, color: s.color }} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 500 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Upcoming Meetings</h3>
          {prescriptionFeedback.message ? (
            <div
              style={{
                marginBottom: 12,
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: '0.85rem',
                background: prescriptionFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: prescriptionFeedback.type === 'success' ? '#166534' : '#b91c1c',
                border: `1px solid ${prescriptionFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`
              }}
            >
              {prescriptionFeedback.message}
            </div>
          ) : null}
          {apptLoading ? (
            <div className="loading-state">Loading meetings...</div>
          ) : upcomingMeetingAppts.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No upcoming meetings.</div>
          ) : (
            upcomingMeetingAppts.map((apt, idx) => (
              <div key={apt._id || idx} className="item-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                      {apt.patientId?.fullName || apt.patientName || 'Patient'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'TBD'} {apt.timeSlot && `at ${apt.timeSlot}`}
                    </div>
                  </div>
                  <span className="status status-confirmed">{apt.status}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleJoinMeeting(apt)}
                    disabled={!apt.videoMeetingUrl}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    <VideoCameraIcon style={{ width: 14, height: 14 }} />
                    {apt.videoMeetingUrl ? 'Join Live Meeting' : 'Meeting Link Not Ready'}
                  </button>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Write prescription for this patient..."
                    value={prescriptionDrafts[apt._id] || ''}
                    onChange={(event) => handlePrescriptionDraftChange(apt._id, event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleIssuePrescription(apt)}
                    disabled={prescriptionState.appointmentId === apt._id}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    {prescriptionState.appointmentId === apt._id ? 'Issuing...' : 'Issue Prescription'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Consultation Requests */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Consultation Requests</h3>
          {actionFeedback && (
            <div style={{
              marginBottom: 12, padding: '10px 12px', borderRadius: 10, fontSize: '0.85rem',
              background: actionFeedback.includes('success') || actionFeedback.includes('confirmed') ? '#f0fdf4' : '#fef2f2',
              color: actionFeedback.includes('success') || actionFeedback.includes('confirmed') ? '#166534' : '#b91c1c',
              border: `1px solid ${actionFeedback.includes('success') || actionFeedback.includes('confirmed') ? '#bbf7d0' : '#fecaca'}`
            }}>
              {actionFeedback}
            </div>
          )}
          {pendingAppts.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No pending consultation requests.</div>
          ) : (
            pendingAppts.map((r, idx) => (
              <div key={r._id || idx} className="item-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                    {r.patientId?.fullName || r.patientName || 'Patient'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    {r.reason || 'Consultation'} • {r.appointmentDate ? new Date(r.appointmentDate).toLocaleDateString() : ''} {r.timeSlot && `at ${r.timeSlot}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleAppointmentAction(r._id, 'accept')}
                    disabled={actionState.id === r._id}
                  >
                    <CheckCircleIcon style={{ width: 14, height: 14 }} />
                    {actionState.id === r._id && actionState.action === 'accept' ? 'Accepting...' : 'Accept'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleAppointmentAction(r._id, 'reject')}
                    disabled={actionState.id === r._id}
                  >
                    <XCircleIcon style={{ width: 14, height: 14 }} />
                    {actionState.id === r._id && actionState.action === 'reject' ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ marginTop: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Ongoing Meetings</h3>
          {apptLoading ? (
            <div className="loading-state">Loading meetings...</div>
          ) : ongoingMeetingAppts.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No ongoing meetings right now.</div>
          ) : (
            ongoingMeetingAppts.map((apt, idx) => (
              <div key={apt._id || idx} className="item-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                      {apt.patientId?.fullName || apt.patientName || 'Patient'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'TBD'} {apt.timeSlot && `at ${apt.timeSlot}`}
                    </div>
                  </div>
                  <span className="status status-confirmed">{apt.status}</span>
                </div>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleJoinMeeting(apt)}
                  disabled={!apt.videoMeetingUrl}
                  style={{ alignSelf: 'flex-end' }}
                >
                  <VideoCameraIcon style={{ width: 14, height: 14 }} />
                  {apt.videoMeetingUrl ? 'Join Live Meeting' : 'Meeting Link Not Ready'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Today's Schedule */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Today's Schedule</h3>
          {apptLoading ? (
            <div className="loading-state">Loading appointments...</div>
          ) : apptError ? (
            <div className="error-state">{apptError}</div>
          ) : todayAppts.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No appointments scheduled for today.</div>
          ) : (
            todayAppts.map((apt, idx) => (
              <div key={apt._id || idx} className="item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserGroupIcon style={{ width: 20, height: 20, color: 'var(--primary-600)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                      {apt.patientId?.fullName || apt.patientName || 'Patient'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {apt.reason || 'Consultation'} • {apt.timeSlot || 'TBD'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`status ${apt.status?.toLowerCase() === 'confirmed' ? 'status-confirmed' : 'status-pending'}`}>{apt.status}</span>
                  {apt.status?.toLowerCase() === 'confirmed' && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() => handleJoinMeeting(apt)}
                      disabled={!apt.videoMeetingUrl}
                    >
                      <VideoCameraIcon style={{ width: 14, height: 14 }} /> Join
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="card" style={{ maxWidth: 800 }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>All Appointments</h3>
      {apptLoading ? (
        <div className="loading-state">Loading...</div>
      ) : appointments.length === 0 ? (
        <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No appointments found.</div>
      ) : (
        appointments.map((apt, idx) => (
          <div key={apt._id || idx} className="item-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                {apt.patientId?.fullName || apt.patientName || 'Patient'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                {apt.reason || 'Consultation'} • {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'TBD'} {apt.timeSlot && `at ${apt.timeSlot}`}
              </div>
            </div>
            <span className={`status ${apt.status?.toLowerCase() === 'confirmed' ? 'status-confirmed' : apt.status?.toLowerCase() === 'cancelled' ? 'status-inactive' : 'status-pending'}`}>
              {apt.status || 'Pending'}
            </span>
          </div>
        ))
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="card" style={{ maxWidth: 800 }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>Professional Information</h3>
      {profileFeedback.message && (
        <div style={{
          marginBottom: 20, padding: '12px 14px', borderRadius: 14, fontSize: '0.9rem',
          background: profileFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: profileFeedback.type === 'success' ? '#166534' : '#b91c1c',
          border: `1px solid ${profileFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {profileFeedback.message}
        </div>
      )}
      {profileLoading ? (
        <div className="loading-state">Loading profile...</div>
      ) : (
        <form onSubmit={handleProfileSave}>
          <div className="grid grid-cols-2 gap-5" style={{ marginBottom: 24 }}>
            {[
              { label: 'Full Name', name: 'fullName', type: 'text' },
              { label: 'Specialty', name: 'specialty', type: 'text' },
              { label: 'Years of Experience', name: 'yearsOfExperience', type: 'number' },
              { label: 'License Number', name: 'medicalLicenseNumber', type: 'text' },
              { label: 'Consultation Fee ($)', name: 'consultationFee', type: 'number' },
              { label: 'Languages (comma separated)', name: 'languages', type: 'text' },
            ].map((f, i) => (
              <div key={i} className="form-group">
                <label className="form-label">{f.label}</label>
                <input
                  type={f.type}
                  name={f.name}
                  value={profileForm[f.name]}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
            ))}
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Qualifications (comma separated)</label>
            <input
              type="text"
              name="qualifications"
              value={profileForm.qualifications}
              onChange={handleProfileChange}
              className="form-input"
              placeholder="e.g. MBBS, MD, FRCS"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Bio</label>
            <textarea
              name="bio"
              value={profileForm.bio}
              onChange={handleProfileChange}
              rows={3}
              className="form-textarea"
              placeholder="Describe your experience and expertise..."
            />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Available Schedule</label>
            {profileForm.availability.length === 0 ? (
              <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: 12 }}>No working hours set. Patients will not be able to book you.</div>
            ) : (
              <div className="space-y-3" style={{ marginBottom: 16 }}>
                {profileForm.availability.map((block, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <select className="form-input" value={block.dayOfWeek} onChange={(e) => updateAvailability(i, 'dayOfWeek', e.target.value)} style={{ padding: '8px', minHeight: 'auto' }}>
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input type="text" className="form-input" placeholder="09:00 AM" value={block.startTime} onChange={(e) => updateAvailability(i, 'startTime', e.target.value)} style={{ padding: '8px', minHeight: 'auto' }} />
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>to</span>
                    <input type="text" className="form-input" placeholder="05:00 PM" value={block.endTime} onChange={(e) => updateAvailability(i, 'endTime', e.target.value)} style={{ padding: '8px', minHeight: 'auto' }} />
                    <button type="button" onClick={() => removeAvailability(i)} className="btn btn-danger btn-sm" style={{ padding: '6px' }}><XCircleIcon style={{ width: 14, height: 14 }} /></button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={addAvailability} className="btn btn-secondary btn-sm">+ Add Time Slot</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" type="submit" disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
      {!profileLoading ? (
        <div
          style={{
            borderTop: '1px solid var(--gray-100)',
            marginTop: 26,
            paddingTop: 26,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'center'
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#991b1b' }}>
              Delete Account
            </h3>
            <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Permanently remove your doctor login account from MediConnect.
            </p>
          </div>
          <button
            className="btn btn-danger btn-lg"
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
          >
            <TrashIcon style={{ width: 18, height: 18 }} />
            {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      ) : null}
    </div>
  );

  const renderPatientReports = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 0 }}>Patient Reports</h3>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadPatientReports}
          disabled={reportsLoading}
        >
          {reportsLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {reportsError ? (
        <div className="error-state" style={{ marginBottom: 14 }}>{reportsError}</div>
      ) : null}

      {reportsLoading ? (
        <div className="loading-state">Loading reports grouped by patient...</div>
      ) : patientsWithAppointments.length === 0 ? (
        <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
          No patients found yet. Reports will appear here once appointments are available.
        </div>
      ) : (
        <div className="space-y-3">
          {patientsWithAppointments.map((patient) => {
            const groupedReports = reportsByPatient[patient.userId];
            const reports = groupedReports?.reports || [];
            const patientError = groupedReports?.error || '';

            return (
              <div
                key={patient.id}
                style={{
                  border: '1px solid var(--gray-100)',
                  borderRadius: 14,
                  padding: 14,
                  background: 'var(--gray-50)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 10
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                      {patient.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {reports.length} report{reports.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                {patientError ? (
                  <div className="error-state">{patientError}</div>
                ) : reports.length === 0 ? (
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                    No reports uploaded for this patient.
                  </div>
                ) : (
                  reports.map((report, idx) => (
                    <div key={report._id || `${patient.userId}-${idx}`} className="item-row" style={{ background: 'white' }}>
                      {(() => {
                        const fileUrl = buildReportFileUrl(report);
                        const isPdf = String(report.mimeType || '').toLowerCase() === 'application/pdf';
                        return (
                          <>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                                {report.reportType || 'Medical Report'}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                                {report.fileName || 'Unnamed file'} • {report.uploadedAt ? new Date(report.uploadedAt).toLocaleString() : 'Unknown date'}
                              </div>
                              {report.notes ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: 2 }}>
                                  {report.notes}
                                </div>
                              ) : null}
                            </div>
                            {fileUrl ? (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary btn-sm"
                              >
                                {isPdf ? 'Open PDF' : 'View'}
                              </a>
                            ) : (
                              <span className="status status-pending">No file URL</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout
      title="Doctor Dashboard"
      subtitle={`Welcome, ${session?.user?.fullName || 'Doctor'} — Manage your schedule, patients, and consultations`}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      sidebarLinks={sidebarLinks}
    >
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'schedule' && renderSchedule()}
      {activeTab === 'patients' && (
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Patient List</h3>
          {apptLoading ? (
            <div className="loading-state">Loading...</div>
          ) : appointments.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No patient records available.</div>
          ) : (
            appointments.map((apt, idx) => (
              <div key={apt._id || idx} className="item-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                    {apt.patientId?.fullName || apt.patientName || 'Patient'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    {apt.reason || 'General'} • {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : ''}
                  </div>
                </div>
                <span className={`status ${apt.status?.toLowerCase() === 'confirmed' ? 'status-confirmed' : 'status-pending'}`}>{apt.status || 'Pending'}</span>
              </div>
            ))
          )}
        </div>
      )}
      {activeTab === 'patient-reports' && renderPatientReports()}
      {activeTab === 'profile' && renderProfile()}
    </DashboardLayout>
  );
};

export default Doctor;
