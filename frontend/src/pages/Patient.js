/* eslint-disable react/no-array-index-key, no-nested-ternary */
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarIcon, UserIcon, DocumentTextIcon, ChatBubbleLeftRightIcon,
  BellIcon, HeartIcon, VideoCameraIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { fetchPatientAppointments, cancelAppointment, rescheduleAppointment } from '../services/api';
import { getSession } from '../services/session';

const Patient = () => {
  const session = getSession();
  const userName = session?.user?.fullName || 'Patient';
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionState, setActionState] = useState({ id: '', action: '' });
  const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });
  
  // Reschedule State
  const [rescheduleId, setRescheduleId] = useState('');
  const [rescheduleForm, setRescheduleForm] = useState({ newAppointmentDate: '', newTimeSlot: '' });

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await fetchPatientAppointments();
      const records = Array.isArray(response?.data) ? response.data : [];
      setAppointments(records);
    } catch (error) {
      setLoadError(error.message || 'Failed to load appointments.');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleCancel = async (id) => {
    setActionState({ id, action: 'cancel' });
    setActionFeedback({ type: '', message: '' });
    try {
      await cancelAppointment(id);
      setActionFeedback({ type: 'success', message: 'Appointment cancelled successfully.' });
      await loadAppointments();
    } catch (error) {
      setActionFeedback({ type: 'error', message: error.message || 'Failed to cancel appointment.' });
    } finally {
      setActionState({ id: '', action: '' });
    }
  };

  const openReschedule = (apt) => {
    setRescheduleId(apt._id);
    setRescheduleForm({
      newAppointmentDate: apt.appointmentDate ? apt.appointmentDate.slice(0, 10) : '',
      newTimeSlot: apt.timeSlot || ''
    });
    setActionFeedback({ type: '', message: '' });
  };

  const handleRescheduleDateChange = (event) => {
    setRescheduleForm((current) => ({ ...current, newAppointmentDate: event.target.value }));
  };

  const handleRescheduleTimeChange = (event) => {
    setRescheduleForm((current) => ({ ...current, newTimeSlot: event.target.value }));
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleId) return;
    setActionState({ id: rescheduleId, action: 'reschedule' });
    setActionFeedback({ type: '', message: '' });
    try {
      const iso = rescheduleForm.newAppointmentDate
        ? new Date(`${rescheduleForm.newAppointmentDate}T00:00:00.000Z`).toISOString()
        : '';
      await rescheduleAppointment(rescheduleId, {
        newAppointmentDate: iso,
        newTimeSlot: rescheduleForm.newTimeSlot
      });
      setActionFeedback({ type: 'success', message: 'Appointment rescheduled successfully.' });
      setRescheduleId('');
      setRescheduleForm({ newAppointmentDate: '', newTimeSlot: '' });
      await loadAppointments();
    } catch (error) {
      setActionFeedback({ type: 'error', message: error.message || 'Failed to reschedule appointment.' });
    } finally {
      setActionState({ id: '', action: '' });
    }
  };

  const handleJoinMeeting = (appointment) => {
    if (!appointment?.videoMeetingUrl) return;
    navigate(`/telemedicine-room?appointmentId=${encodeURIComponent(appointment._id)}`, {
      state: { appointment }
    });
  };

  const handleJoinMeetingClick = (event) => {
    const appointmentId = event.currentTarget.dataset.appointmentId;
    const appointment = appointments.find((item) => item._id === appointmentId);
    if (appointment) {
      handleJoinMeeting(appointment);
    }
  };

  const handleToggleRescheduleClick = (event) => {
    const appointmentId = event.currentTarget.dataset.appointmentId;
    const appointment = appointments.find((item) => item._id === appointmentId);

    if (!appointment) return;

    if (rescheduleId === appointmentId) {
      setRescheduleId('');
      return;
    }

    openReschedule(appointment);
  };

  const handleCancelClick = (event) => {
    const appointmentId = event.currentTarget.dataset.appointmentId;
    if (appointmentId) {
      handleCancel(appointmentId);
    }
  };

  const getAppointmentStatusClass = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();
    if (normalizedStatus === 'confirmed') return 'status-confirmed';
    if (normalizedStatus === 'cancelled') return 'status-inactive';
    return 'status-pending';
  };

  const upcomingCount = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Pending').length;

  const renderDashboard = () => (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-5" style={{ marginBottom: 32 }}>
        {[
          { label: 'Upcoming', value: String(upcomingCount), color: '#4f46e5', bg: '#eef2ff', icon: CalendarIcon },
          { label: 'Total Bookings', value: String(appointments.length), color: '#10b981', bg: '#ecfdf5', icon: DocumentTextIcon },
          { label: 'Consultations', value: appointments.filter(a => a.status === 'Confirmed').length.toString(), color: '#0ea5e9', bg: '#f0f9ff', icon: ChatBubbleLeftRightIcon },
          { label: 'Health Score', value: '92%', color: '#f59e0b', bg: '#fffbeb', icon: HeartIcon },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 20, height: 20, color: stat.color }} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 2 }}>{stat.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 500 }}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Appointments from API */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>My Appointments</h3>
            <Link to="/patient/book-appointment" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-600)' }}>Book New</Link>
          </div>
          
          {actionFeedback.message && (
            <div style={{
              marginBottom: 12, padding: '10px 12px', borderRadius: 10, fontSize: '0.85rem',
              background: actionFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: actionFeedback.type === 'success' ? '#166534' : '#b91c1c',
              border: `1px solid ${actionFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}>
              {actionFeedback.message}
            </div>
          )}

          {(() => {
            if (isLoading) {
              return <div className="loading-state">Loading appointments...</div>;
            }

            if (loadError) {
              return <div className="error-state">{loadError}</div>;
            }

            if (appointments.length === 0) {
              return (
                <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem', padding: '16px 0' }}>
                  No appointments yet. <Link to="/patient/book-appointment" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Book one now</Link>
                </div>
              );
            }

            return appointments.slice(0, 4).map((apt, idx) => {
              const status = (apt.status || '').toLowerCase();
              const canModify = status === 'pending' || status === 'confirmed';
              const isRescheduling = rescheduleId === apt._id;
              
              return (
                <div key={apt._id || idx} style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: 12, marginBottom: 12 }}>
                  <div className="item-row" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserIcon style={{ width: 20, height: 20, color: 'var(--primary-600)' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)', marginBottom: 2 }}>
                          {apt.doctorId?.fullName || apt.doctorId?.name || apt.doctorName || 'Doctor'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                          {apt.specialty || apt.doctorId?.specialty || 'General'} • {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'TBD'} {apt.timeSlot && `at ${apt.timeSlot}`}
                        </div>
                      </div>
                    </div>
                    <span className={`status ${getAppointmentStatusClass(status)}`}>
                      {apt.status || 'pending'}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  {canModify && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                      {status === 'confirmed' && apt.videoMeetingUrl && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={handleJoinMeetingClick}
                          data-appointment-id={apt._id}
                          style={{ marginRight: 'auto' }}
                        >
                          <VideoCameraIcon style={{ width: 14, height: 14 }} /> Join Call
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleToggleRescheduleClick}
                        data-appointment-id={apt._id}
                        disabled={actionState.id === apt._id}
                      >
                        {isRescheduling ? 'Close' : 'Reschedule'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={handleCancelClick}
                        data-appointment-id={apt._id}
                        disabled={actionState.id === apt._id}
                      >
                        {actionState.id === apt._id && actionState.action === 'cancel' ? 'Cancelling...' : 'Cancel'}
                      </button>
                    </div>
                  )}

                  {/* Reschedule Form */}
                  {isRescheduling && (
                    <form onSubmit={handleReschedule} style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        type="date"
                        className="form-input"
                        value={rescheduleForm.newAppointmentDate}
                        onChange={handleRescheduleDateChange}
                        required
                        style={{ padding: '8px', minHeight: 'auto', flex: '1 1 140px' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="HH:MM (e.g. 09:00)"
                        value={rescheduleForm.newTimeSlot}
                        onChange={handleRescheduleTimeChange}
                        required
                        style={{ padding: '8px', minHeight: 'auto', flex: '1 1 120px' }}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={actionState.id === apt._id && actionState.action === 'reschedule'}
                      >
                        {actionState.id === apt._id && actionState.action === 'reschedule' ? 'Saving...' : 'Confirm'}
                      </button>
                    </form>
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* Notifications placeholder */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Notifications</h3>
            <BellIcon style={{ width: 18, height: 18, color: 'var(--gray-400)' }} />
          </div>
          {appointments.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No new notifications.</div>
          ) : (
            appointments.slice(0, 3).map((apt, idx) => (
              <div key={apt._id || `${apt.doctorName}-${apt.appointmentDate}-${idx}`} style={{
                padding: '14px 16px', background: 'var(--gray-50)', borderRadius: 14,
                marginBottom: 10, border: '1px solid var(--gray-100)'
              }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-700)', marginBottom: 4 }}>
                  Appointment {apt.status === 'Confirmed' ? 'confirmed' : 'pending'} with {apt.doctorId?.name || 'your doctor'}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                  {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : ''}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/patient/book-appointment', icon: CalendarIcon, label: 'Book Appointment', color: '#4f46e5', bg: '#eef2ff' },
              { to: '/patient/profile', icon: DocumentTextIcon, label: 'Medical Records', color: '#10b981', bg: '#ecfdf5' },
              { to: '/patient/symptom-checker', icon: ChatBubbleLeftRightIcon, label: 'AI Symptom Checker', color: '#7c3aed', bg: '#f5f3ff' },
              { to: '/patient/profile', icon: UserIcon, label: 'My Profile', color: '#0ea5e9', bg: '#f0f9ff' },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} to={action.to} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderRadius: 14, border: '1px solid var(--gray-100)', textDecoration: 'none',
                  transition: 'all 0.2s ease', background: 'white'
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 18, height: 18, color: action.color }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)' }}>{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: '32px 0 60px' }}>
        <div className="container">
          <div className="dashboard-header animate-fade-in-up">
            <h1 className="dashboard-title">Welcome, {userName} 👋</h1>
            <p className="dashboard-subtitle" style={{ marginBottom: 0 }}>Manage your appointments, prescriptions, and health records</p>
          </div>
          <div className="animate-fade-in-up delay-100">
            {renderDashboard()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Patient;
