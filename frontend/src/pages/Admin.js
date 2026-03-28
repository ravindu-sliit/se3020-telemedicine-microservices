import React, { useState } from 'react';
import { 
  UserGroupIcon, DocumentTextIcon, CogIcon,
  CheckCircleIcon, XCircleIcon, Squares2X2Icon,
  ShieldCheckIcon, ChartBarIcon, BanknotesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../components/DashboardLayout';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Squares2X2Icon },
    { id: 'users', label: 'User Management', icon: UserGroupIcon },
    { id: 'verification', label: 'Verification', icon: ShieldCheckIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon },
  ];

  const platformStats = { totalUsers: 1690, totalDoctors: 456, totalPatients: 1234, totalAppointments: 5678, totalRevenue: 85420, satisfactionRate: 98 };

  const users = {
    patients: [
      { id: 'P001', name: 'John Doe', email: 'john@email.com', phone: '+1234567890', joinDate: '2024-01-15', status: 'active' },
      { id: 'P002', name: 'Jane Smith', email: 'jane@email.com', phone: '+1234567891', joinDate: '2024-01-20', status: 'active' },
      { id: 'P003', name: 'Robert Johnson', email: 'robert@email.com', phone: '+1234567892', joinDate: '2024-02-01', status: 'inactive' }
    ],
    doctors: [
      { id: 'D001', name: 'Dr. Sarah Johnson', email: 'sarah@email.com', specialty: 'Cardiology', joinDate: '2024-01-10', status: 'verified' },
      { id: 'D002', name: 'Dr. Michael Chen', email: 'michael@email.com', specialty: 'Dermatology', joinDate: '2024-01-12', status: 'verified' },
    ]
  };

  const doctorVerificationRequests = [
    { id: 'D004', name: 'Dr. James Wilson', email: 'james@email.com', specialty: 'Orthopedics', licenseNumber: 'MD789012', experience: '20 years', medicalSchool: 'Johns Hopkins University', submissionDate: '2024-03-25', status: 'pending' },
    { id: 'D005', name: 'Dr. Lisa Anderson', email: 'lisa@email.com', specialty: 'Neurology', licenseNumber: 'MD345678', experience: '12 years', medicalSchool: 'Mayo Clinic School of Medicine', submissionDate: '2024-03-26', status: 'pending' }
  ];

  const recentTransactions = [
    { id: 1, patient: 'John Doe', doctor: 'Dr. Sarah Johnson', amount: 150, date: '2024-03-28', status: 'completed' },
    { id: 2, patient: 'Jane Smith', doctor: 'Dr. Michael Chen', amount: 120, date: '2024-03-28', status: 'completed' },
    { id: 3, patient: 'Robert Johnson', doctor: 'Dr. Emily Brown', amount: 100, date: '2024-03-27', status: 'pending' }
  ];

  const handleDoctorVerification = (id, action) => console.log(`${action} doctor ${id}`);

  const renderDashboard = () => (
    <div>
      <div className="grid grid-cols-3 gap-5" style={{ marginBottom: 32 }}>
        {[
          { label: 'Total Users', value: platformStats.totalUsers.toLocaleString(), trend: '+12%', color: '#4f46e5', bg: '#eef2ff', icon: UserGroupIcon },
          { label: 'Verified Doctors', value: platformStats.totalDoctors.toString(), trend: '+8', color: '#10b981', bg: '#ecfdf5', icon: ShieldCheckIcon },
          { label: 'Active Patients', value: platformStats.totalPatients.toLocaleString(), trend: '+15%', color: '#0ea5e9', bg: '#f0f9ff', icon: UserGroupIcon },
          { label: 'Appointments', value: platformStats.totalAppointments.toLocaleString(), trend: '+25%', color: '#7c3aed', bg: '#f5f3ff', icon: ChartBarIcon },
          { label: 'Revenue', value: '$' + platformStats.totalRevenue.toLocaleString(), trend: '+18%', color: '#059669', bg: '#ecfdf5', icon: BanknotesIcon },
          { label: 'Satisfaction', value: platformStats.satisfactionRate + '%', trend: '+2%', color: '#f59e0b', bg: '#fffbeb', icon: ArrowTrendingUpIcon },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 20, height: 20, color: s.color }} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 999 }}>{s.trend}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 500 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Recent Transactions</h3>
          {recentTransactions.map(t => (
            <div key={t.id} className="item-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{t.patient} → {t.doctor}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{t.date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 2 }}>${t.amount}</div>
                <span className={`status ${t.status === 'completed' ? 'status-confirmed' : 'status-pending'}`}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Pending Verifications</h3>
          {doctorVerificationRequests.map(r => (
            <div key={r.id} className="item-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{r.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{r.specialty} • {r.experience}</div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{r.submissionDate}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-success btn-sm" onClick={() => handleDoctorVerification(r.id, 'approve')}>
                  <CheckCircleIcon style={{ width: 14, height: 14 }} /> Approve
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDoctorVerification(r.id, 'reject')}>
                  <XCircleIcon style={{ width: 14, height: 14 }} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="card">
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>User Management</h3>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>Patients</h4>
        {users.patients.map(u => (
          <div key={u.id} className="item-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserGroupIcon style={{ width: 18, height: 18, color: 'var(--primary-600)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{u.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{u.email} • {u.id}</div>
              </div>
            </div>
            <span className={`status ${u.status === 'active' ? 'status-active' : 'status-inactive'}`}>{u.status}</span>
          </div>
        ))}
      </div>
      <div>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>Doctors</h4>
        {users.doctors.map(u => (
          <div key={u.id} className="item-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--success-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheckIcon style={{ width: 18, height: 18, color: 'var(--success-600)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{u.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{u.specialty} • {u.email}</div>
              </div>
            </div>
            <span className="status status-confirmed">verified</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVerification = () => (
    <div className="card">
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Doctor Verification Requests</h3>
      {doctorVerificationRequests.map(r => (
        <div key={r.id} style={{
          padding: 20, border: '1px solid var(--gray-100)', borderRadius: 16,
          marginBottom: 16, background: 'var(--gray-50)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-900)', marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{r.email}</div>
            </div>
            <span className="status status-pending">{r.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            {[
              { l: 'Specialty', v: r.specialty }, { l: 'Experience', v: r.experience },
              { l: 'License #', v: r.licenseNumber }, { l: 'Medical School', v: r.medicalSchool },
            ].map((d, i) => (
              <div key={i}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{d.l}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--gray-700)', fontWeight: 500 }}>{d.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-success btn-sm" onClick={() => handleDoctorVerification(r.id, 'approve')}>
              <CheckCircleIcon style={{ width: 14, height: 14 }} /> Approve
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDoctorVerification(r.id, 'reject')}>
              <XCircleIcon style={{ width: 14, height: 14 }} /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Platform overview and management"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      sidebarLinks={sidebarLinks}
    >
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'verification' && renderVerification()}
      {activeTab === 'settings' && (
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>System Settings</h3>
          <div className="grid grid-cols-2 gap-5">
            <div className="form-group"><label className="form-label">Platform Name</label><input type="text" defaultValue="MediConnect" className="form-input" /></div>
            <div className="form-group"><label className="form-label">Support Email</label><input type="email" defaultValue="support@mediconnect.com" className="form-input" /></div>
            <div className="form-group"><label className="form-label">Max Session Duration (min)</label><input type="number" defaultValue="60" className="form-input" /></div>
            <div className="form-group"><label className="form-label">Default Currency</label><select defaultValue="USD" className="form-select"><option>USD</option><option>EUR</option><option>GBP</option></select></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-primary">Save Settings</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Admin;
