/* eslint-disable react/no-array-index-key, no-nested-ternary */
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarIcon, UserIcon, DocumentTextIcon, ChatBubbleLeftRightIcon,
  BellIcon, HeartIcon, VideoCameraIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { fetchPatientAppointments, cancelAppointment, rescheduleAppointment, fetchMyPrescriptions } from '../services/api';
import { getSession } from '../services/session';

const Patient = () => {
  const session = getSession();
  const userName = session?.user?.fullName || 'Patient';
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionState, setActionState] = useState({ id: '', action: '' });
  const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Reschedule State
  const [rescheduleId, setRescheduleId] = useState('');
  const [rescheduleForm, setRescheduleForm] = useState({ newAppointmentDate: '', newTimeSlot: '' });

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [appointmentsResponse, prescriptionsResponse] = await Promise.all([
        fetchPatientAppointments(),
        fetchMyPrescriptions()
      ]);
      const appointmentRecords = Array.isArray(appointmentsResponse?.data) ? appointmentsResponse.data : [];
      const prescriptionRecords = Array.isArray(prescriptionsResponse?.data) ? prescriptionsResponse.data : [];
      setAppointments(appointmentRecords);
      setPrescriptions(prescriptionRecords);
    } catch (error) {
      setLoadError(error.message || 'Failed to load appointments.');
      setAppointments([]);
      setPrescriptions([]);
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
  const normalizedSearch = appointmentSearch.trim().toLowerCase();
  const filteredAppointments = appointments.filter((apt) => {
    const doctorName = (apt.doctorId?.fullName || apt.doctorId?.name || apt.doctorName || '').toLowerCase();
    const status = String(apt.status || '').toLowerCase();
    const matchesSearch = !normalizedSearch || doctorName.includes(normalizedSearch);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

      <div className="grid grid-rows-2 gap-6">
        {/* Appointments from API */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>My Appointments</h3>
            <Link to="/patient/book-appointment" 
            style={{ 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              color: 'white', 
              backgroundColor: 'var(--primary-600)',
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none', 
              display: 'inline-block' 
            }}
          >
            Book New
          </Link>
          </div>
          <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 12 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by doctor name"
              value={appointmentSearch}
              onChange={(event) => setAppointmentSearch(event.target.value)}
            />
            <select
              className="form-input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
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

            if (filteredAppointments.length === 0) {
              return (
                <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem', padding: '8px 0 16px' }}>
                  No appointments match your search/filter.
                </div>
              );
            }

            return filteredAppointments.slice(0, 4).map((apt, idx) => {
              const status = (apt.status || '').toLowerCase();
              const canModify = status === 'pending' || status === 'confirmed';
              const isRescheduling = rescheduleId === apt._id;
              const appointmentPrescriptions = prescriptions.filter(
                (item) => String(item?.appointmentId || '').trim() === String(apt?._id || '').trim()
              );
              const doctorName = apt.doctorId?.fullName || apt.doctorId?.name || apt.doctorName || 'Doctor';
              const specialty = apt.specialty || apt.doctorId?.specialty || 'General';
              const appointmentDateLabel = apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'TBD';
              
              return (
                <div
                  key={apt._id || idx}
                  style={{
                    border: '1px solid var(--gray-100)',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 12,
                    background: 'white'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UserIcon style={{ width: 20, height: 20, color: 'var(--primary-600)' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)', marginBottom: 2 }}>
                          {doctorName}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                          {specialty}
                        </div>
                      </div>
                    </div>
                    <span className={`status ${getAppointmentStatusClass(status)}`}>
                      {apt.status || 'pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 10 }}>
                    <div style={{ padding: 10, border: '1px solid var(--gray-100)', borderRadius: 10, background: 'var(--gray-50)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontWeight: 700, marginBottom: 3 }}>DATE</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-700)', fontWeight: 600 }}>
                        {appointmentDateLabel}
                      </div>
                    </div>
                    <div style={{ padding: 10, border: '1px solid var(--gray-100)', borderRadius: 10, background: 'var(--gray-50)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontWeight: 700, marginBottom: 3 }}>TIME</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-700)', fontWeight: 600 }}>
                        {apt.timeSlot || 'TBD'}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--gray-400)', marginBottom: 8 }}>
                    Appointment ID: {apt._id || 'N/A'}
                  </div>

                  {/* Action Buttons */}
                  {canModify && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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

                  {appointmentPrescriptions.length > 0 && (
                    <div
                      style={{
                        marginTop: 10,
                        background: '#f8fafc',
                        border: '1px solid var(--gray-100)',
                        borderRadius: 10,
                        padding: 10
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', marginBottom: 6 }}>
                        PRESCRIPTION
                      </div>
                      {appointmentPrescriptions.map((item, pIndex) => (
                        <div key={`${apt._id}-prescription-${pIndex}`} style={{ marginBottom: pIndex < appointmentPrescriptions.length - 1 ? 8 : 0 }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--gray-700)', whiteSpace: 'pre-wrap' }}>
                            {item.prescriptionText || 'Prescription details unavailable.'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 4 }}>
                            Issued {item.dateIssued ? new Date(item.dateIssued).toLocaleString() : 'recently'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* Notifications placeholder */}
        {/* <div className="card">
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
                 Appointment {
                      apt.status === 'Confirmed' 
                        ? 'confirmed' 
                        : apt.status === 'Cancelled' 
                          ? 'cancelled' 
                          : 'pending'
                    } with {apt.doctorName || 'your doctor'}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                  {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : ''}
                </span>
              </div>
            ))
          )}
        </div> */}

        {/* Quick Actions */}
        {/* <div className="card">
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
        </div> */}
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
