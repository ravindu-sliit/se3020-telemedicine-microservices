import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon, UserIcon, DocumentTextIcon, ChatBubbleLeftRightIcon,
  BellIcon, HeartIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { fetchPatientAppointments } from '../services/api';
import { getSession } from '../services/session';

const Patient = () => {
  const session = getSession();
  const userName = session?.user?.fullName || 'Patient';

  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

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

  const upcomingCount = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length;

  const renderDashboard = () => (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-5" style={{ marginBottom: 32 }}>
        {[
          { label: 'Upcoming', value: String(upcomingCount), color: '#4f46e5', bg: '#eef2ff', icon: CalendarIcon },
          { label: 'Total Bookings', value: String(appointments.length), color: '#10b981', bg: '#ecfdf5', icon: DocumentTextIcon },
          { label: 'Consultations', value: appointments.filter(a => a.status === 'confirmed').length.toString(), color: '#0ea5e9', bg: '#f0f9ff', icon: ChatBubbleLeftRightIcon },
          { label: 'Health Score', value: '92%', color: '#f59e0b', bg: '#fffbeb', icon: HeartIcon },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="stat-card">
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
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Upcoming Appointments</h3>
            <Link to="/patient/book-appointment" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-600)' }}>Book New</Link>
          </div>
          {isLoading ? (
            <div className="loading-state">Loading appointments...</div>
          ) : loadError ? (
            <div className="error-state">{loadError}</div>
          ) : appointments.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem', padding: '16px 0' }}>
              No appointments yet. <Link to="/patient/book-appointment" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Book one now</Link>
            </div>
          ) : (
            appointments.slice(0, 4).map((apt, idx) => (
              <div key={apt._id || idx} className="item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserIcon style={{ width: 20, height: 20, color: 'var(--primary-600)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)', marginBottom: 2 }}>
                      {apt.doctorId?.name || apt.doctorName || 'Doctor'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {apt.specialty || apt.doctorId?.specialty || 'General'} • {apt.date ? new Date(apt.date).toLocaleDateString() : 'TBD'} {apt.time && `at ${apt.time}`}
                    </div>
                  </div>
                </div>
                <span className={`status ${apt.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}`}>{apt.status || 'pending'}</span>
              </div>
            ))
          )}
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
              <div key={idx} style={{
                padding: '14px 16px', background: 'var(--gray-50)', borderRadius: 14,
                marginBottom: 10, border: '1px solid var(--gray-100)'
              }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-700)', marginBottom: 4 }}>
                  Appointment {apt.status === 'confirmed' ? 'confirmed' : 'pending'} with {apt.doctorId?.name || 'your doctor'}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                  {apt.date ? new Date(apt.date).toLocaleDateString() : ''}
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
                <Link key={i} to={action.to} style={{
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
