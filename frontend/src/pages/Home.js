import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, UserGroupIcon, DocumentTextIcon, CogIcon,
  ClipboardDocumentListIcon, UserCircleIcon, StarIcon,
  ArrowRightIcon, HeartIcon
} from '@heroicons/react/24/outline';
import { FaUserMd, FaUserShield } from 'react-icons/fa';
import Navbar from '../components/Navbar';

const Home = () => {
  const userRole = localStorage.getItem('userRole') || 'patient';

  const roles = [
    { id: 'doctor', label: 'Doctor', icon: FaUserMd, color: '#4f46e5', bg: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', desc: 'Manage patients and schedules', path: '/doctor' },
    { id: 'admin', label: 'Admin', icon: FaUserShield, color: '#dc2626', bg: 'linear-gradient(135deg, #fef2f2, #fee2e2)', desc: 'Oversee platform operations', path: '/admin' },
  ];

  const features = {
    patient: [
      { title: 'Book Appointment', description: 'Schedule consultations with healthcare professionals', icon: CalendarIcon },
      { title: 'Medical Records', description: 'View and manage your medical history', icon: DocumentTextIcon },
      { title: 'Find Doctors', description: 'Search and filter doctors by specialty', icon: UserGroupIcon },
      { title: 'AI Symptom Checker', description: 'Get preliminary health assessments', icon: CogIcon }
    ],
    doctor: [
      { title: 'My Schedule', description: 'Manage your appointment calendar', icon: CalendarIcon },
      { title: 'Patient Queue', description: 'View upcoming patient consultations', icon: UserGroupIcon },
      { title: 'Prescriptions', description: 'Issue digital prescriptions', icon: ClipboardDocumentListIcon },
      { title: 'Profile Settings', description: 'Update your professional information', icon: UserCircleIcon }
    ],
    admin: [
      { title: 'User Management', description: 'Manage patient and doctor accounts', icon: UserGroupIcon },
      { title: 'Doctor Verification', description: 'Review and approve doctor registrations', icon: DocumentTextIcon },
      { title: 'Platform Analytics', description: 'Monitor platform usage and statistics', icon: CogIcon },
      { title: 'System Settings', description: 'Configure platform parameters', icon: CogIcon }
    ]
  };

  const currentFeatures = features[userRole] || features.patient;

  const stats = [
    { value: '1,234', label: 'Active Patients', color: '#4f46e5', bg: '#eef2ff' },
    { value: '456', label: 'Verified Doctors', color: '#10b981', bg: '#ecfdf5' },
    { value: '5,678', label: 'Consultations', color: '#0ea5e9', bg: '#f0f9ff' },
    { value: '98%', label: 'Satisfaction', color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: '40px 0 80px' }}>
        <div className="container">
          {/* Welcome Header */}
          <div className="animate-fade-in-up" style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
            borderRadius: 24, padding: '40px 48px', marginBottom: 40,
            position: 'relative', overflow: 'hidden'
          }}>
            <div className="glass-orb" style={{ width: 200, height: 200, top: -60, right: -40, opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: 8, letterSpacing: '-0.03em' }}>
                Welcome to MediConnect
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 24, fontSize: '1rem' }}>
                Select your role to get started with the platform
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.15)', padding: '6px 16px',
                borderRadius: 999, fontSize: '0.85rem', color: 'white', fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                Current role: <strong style={{ textTransform: 'capitalize' }}>{userRole}</strong>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 20 }}>Portals</h2>
            <div className="grid grid-cols-2 gap-6">
              {roles.map((role, i) => {
                const Icon = role.icon;
                return (
                  <div key={role.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div
                      style={{
                        background: 'white', borderRadius: 20, padding: 28, cursor: 'default',
                        border: '2px solid var(--gray-100)',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden'
                      }}
                    >
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, background: role.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
                      }}>
                        <Icon style={{ fontSize: 22, color: role.color }} />
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{role.label}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 16 }}>{role.desc}</p>
                      <Link to={role.path} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: '0.85rem', fontWeight: 600, color: role.color, textDecoration: 'none'
                      }}>
                        Go to Dashboard <ArrowRightIcon style={{ width: 16, height: 16 }} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 20 }}>Quick Actions</h2>
            <div className="grid grid-cols-4 gap-5">
              {currentFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="card animate-fade-in-up" style={{
                    textAlign: 'center', padding: 24, cursor: 'pointer',
                    animationDelay: `${index * 0.08}s`
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: 'var(--primary-50)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px'
                    }}>
                      <Icon style={{ width: 22, height: 22, color: 'var(--primary-600)' }} />
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4, color: 'var(--gray-900)' }}>{feature.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 0, lineHeight: 1.5 }}>{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 20 }}>Platform Statistics</h2>
            <div className="grid grid-cols-4 gap-5">
              {stats.map((stat, i) => (
                <div key={i} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: stat.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12
                  }}>
                    {stat.label === 'Satisfaction' ? (
                      <StarIcon style={{ width: 20, height: 20, color: stat.color }} />
                    ) : (
                      <HeartIcon style={{ width: 20, height: 20, color: stat.color }} />
                    )}
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 2 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
