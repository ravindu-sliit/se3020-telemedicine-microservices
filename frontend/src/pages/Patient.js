import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, UserIcon, DocumentTextIcon, ChatBubbleLeftRightIcon,
  BellIcon, HeartIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';

const Patient = () => {

  const upcomingAppointments = [
    { id: 1, doctor: 'Dr. Sarah Johnson', specialty: 'Cardiology', date: '2024-03-29', time: '10:00 AM', status: 'confirmed' },
    { id: 2, doctor: 'Dr. Michael Chen', specialty: 'Dermatology', date: '2024-04-02', time: '2:30 PM', status: 'pending' }
  ];

  const recentPrescriptions = [
    { id: 1, doctor: 'Dr. Sarah Johnson', date: '2024-03-15', medication: 'Lisinopril 10mg', dosage: 'Once daily' },
    { id: 2, doctor: 'Dr. Emily Brown', date: '2024-03-10', medication: 'Metformin 500mg', dosage: 'Twice daily' }
  ];

  const notifications = [
    { id: 1, type: 'appointment', message: 'Appointment with Dr. Sarah Johnson confirmed for tomorrow', time: '2 hours ago' },
    { id: 2, type: 'prescription', message: 'New prescription available from Dr. Emily Brown', time: '1 day ago' }
  ];

  const renderDashboard = () => (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-5" style={{ marginBottom: 32 }}>
        {[
          { label: 'Upcoming', value: '2', color: '#4f46e5', bg: '#eef2ff', icon: CalendarIcon },
          { label: 'Prescriptions', value: '4', color: '#10b981', bg: '#ecfdf5', icon: DocumentTextIcon },
          { label: 'Consultations', value: '12', color: '#0ea5e9', bg: '#f0f9ff', icon: ChatBubbleLeftRightIcon },
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
        {/* Appointments */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Upcoming Appointments</h3>
            <Link to="/patient/book-appointment" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-600)' }}>View All</Link>
          </div>
          {upcomingAppointments.map(apt => (
            <div key={apt.id} className="item-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserIcon style={{ width: 20, height: 20, color: 'var(--primary-600)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)', marginBottom: 2 }}>{apt.doctor}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{apt.specialty} • {apt.date} at {apt.time}</div>
                </div>
              </div>
              <span className={`status ${apt.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}`}>{apt.status}</span>
            </div>
          ))}
        </div>

        {/* Prescriptions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Recent Prescriptions</h3>
          </div>
          {recentPrescriptions.map(rx => (
            <div key={rx.id} className="item-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--success-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DocumentTextIcon style={{ width: 20, height: 20, color: 'var(--success-600)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)', marginBottom: 2 }}>{rx.medication}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{rx.doctor} • {rx.dosage}</div>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{rx.date}</span>
            </div>
          ))}
        </div>

        {/* Notifications */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Notifications</h3>
            <BellIcon style={{ width: 18, height: 18, color: 'var(--gray-400)' }} />
          </div>
          {notifications.map(n => (
            <div key={n.id} style={{
              padding: '14px 16px', background: 'var(--gray-50)', borderRadius: 14,
              marginBottom: 10, border: '1px solid var(--gray-100)'
            }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-700)', marginBottom: 4 }}>{n.message}</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{n.time}</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/patient/book-appointment', icon: CalendarIcon, label: 'Book Appointment', color: '#4f46e5', bg: '#eef2ff' },
              { to: '#', icon: UserIcon, label: 'Find Doctors', color: '#0ea5e9', bg: '#f0f9ff' },
              { to: '#', icon: DocumentTextIcon, label: 'Medical Records', color: '#10b981', bg: '#ecfdf5' },
              { to: '#', icon: ChatBubbleLeftRightIcon, label: 'AI Symptom Checker', color: '#7c3aed', bg: '#f5f3ff' },
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
            <h1 className="dashboard-title">Patient Dashboard</h1>
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
