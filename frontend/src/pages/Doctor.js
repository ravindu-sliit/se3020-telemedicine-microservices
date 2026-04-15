import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, UserGroupIcon, DocumentTextIcon, CogIcon,
  CheckCircleIcon, XCircleIcon, VideoCameraIcon,
  PencilSquareIcon, DocumentPlusIcon, Squares2X2Icon,
  ClockIcon, UserCircleIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../components/DashboardLayout';

const Doctor = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Squares2X2Icon },
    { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    { id: 'patients', label: 'Patients', icon: UserGroupIcon },
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  ];

  const upcomingAppointments = [
    { id: 1, patient: 'John Doe', date: '2024-03-29', time: '10:00 AM', status: 'confirmed', reason: 'Annual checkup', patientId: 'P001' },
    { id: 2, patient: 'Jane Smith', date: '2024-03-29', time: '11:30 AM', status: 'pending', reason: 'Follow-up consultation', patientId: 'P002' },
    { id: 3, patient: 'Robert Johnson', date: '2024-03-29', time: '2:00 PM', status: 'confirmed', reason: 'Cardiac evaluation', patientId: 'P003' }
  ];

  const consultationRequests = [
    { id: 4, patient: 'Emily Davis', date: '2024-03-30', time: '9:00 AM', status: 'pending', reason: 'New patient consultation', patientId: 'P004' },
    { id: 5, patient: 'Michael Wilson', date: '2024-03-30', time: '10:30 AM', status: 'pending', reason: 'Second opinion', patientId: 'P005' }
  ];

  const recentPrescriptions = [
    { id: 1, patient: 'John Doe', date: '2024-03-15', medication: 'Lisinopril 10mg', dosage: 'Once daily', duration: '30 days' },
    { id: 2, patient: 'Jane Smith', date: '2024-03-14', medication: 'Metformin 500mg', dosage: 'Twice daily', duration: '60 days' }
  ];

  const handleAppointmentAction = (id, action) => console.log(`${action} appointment ${id}`);

  const renderDashboard = () => (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-5" style={{ marginBottom: 32 }}>
        {[
          { label: "Today's Patients", value: '8', color: '#4f46e5', bg: '#eef2ff', icon: UserGroupIcon },
          { label: 'Pending Requests', value: String(consultationRequests.length), color: '#f59e0b', bg: '#fffbeb', icon: ClockIcon },
          { label: 'Prescriptions', value: '5', color: '#10b981', bg: '#ecfdf5', icon: DocumentTextIcon },
          { label: 'Rating', value: '4.8', color: '#7c3aed', bg: '#f5f3ff', icon: CheckCircleIcon },
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
        {/* Today's Schedule */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Today's Schedule</h3>
          {upcomingAppointments.map(apt => (
            <div key={apt.id} className="item-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserGroupIcon style={{ width: 20, height: 20, color: 'var(--primary-600)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{apt.patient}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{apt.reason} • {apt.time}</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary-500)' }}>ID: {apt.patientId}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`status ${apt.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}`}>{apt.status}</span>
                {apt.status === 'confirmed' && (
                  <button className="btn btn-success btn-sm">
                    <VideoCameraIcon style={{ width: 14, height: 14 }} /> Join
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Consultation Requests */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Consultation Requests</h3>
          {consultationRequests.map(r => (
            <div key={r.id} className="item-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{r.patient}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{r.reason} • {r.date} at {r.time}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-success btn-sm" onClick={() => handleAppointmentAction(r.id, 'accept')}>
                  <CheckCircleIcon style={{ width: 14, height: 14 }} /> Accept
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleAppointmentAction(r.id, 'reject')}>
                  <XCircleIcon style={{ width: 14, height: 14 }} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Prescriptions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Recent Prescriptions</h3>
            <Link to="/doctor/prescriptions" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-600)' }}>Manage</Link>
          </div>
          {recentPrescriptions.map(rx => (
            <div key={rx.id} className="item-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)', marginBottom: 2 }}>{rx.patient}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{rx.medication} • {rx.dosage} for {rx.duration}</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{rx.date}</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/doctor/schedule', icon: CalendarIcon, label: 'Manage Schedule', color: '#4f46e5', bg: '#eef2ff' },
              { to: '/doctor/prescriptions', icon: DocumentPlusIcon, label: 'Issue Prescription', color: '#10b981', bg: '#ecfdf5' },
              { to: '/doctor/profile', icon: PencilSquareIcon, label: 'Update Profile', color: '#0ea5e9', bg: '#f0f9ff' },
              { to: '/doctor/reports', icon: DocumentTextIcon, label: 'View Reports', color: '#f59e0b', bg: '#fffbeb' },
            ].map((a, i) => {
              const Icon = a.icon;
              return (
                <Link key={i} to={a.to} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderRadius: 14, border: '1px solid var(--gray-100)', textDecoration: 'none',
                  transition: 'all 0.2s ease', background: 'white'
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 18, height: 18, color: a.color }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)' }}>{a.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="card" style={{ maxWidth: 800 }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>Availability Settings</h3>
      <div className="grid grid-cols-2 gap-5" style={{ marginBottom: 24 }}>
        <div className="form-group">
          <label className="form-label">Working Days</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <label key={day} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--gray-700)' }}>
                <input type="checkbox" defaultChecked={!['Saturday', 'Sunday'].includes(day)} /> {day}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Consultation Hours</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="time" defaultValue="09:00" className="form-input" />
            <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>to</span>
            <input type="time" defaultValue="17:00" className="form-input" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Consultation Duration</label>
          <select defaultValue="30" className="form-select">
            <option value="15">15 minutes</option><option value="30">30 minutes</option>
            <option value="45">45 minutes</option><option value="60">60 minutes</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Break Time</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="time" defaultValue="13:00" className="form-input" />
            <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>to</span>
            <input type="time" defaultValue="14:00" className="form-input" />
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Special Notes</label>
        <textarea defaultValue="Please arrive 10 minutes before your scheduled appointment time." rows={3} className="form-textarea" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary">Save Schedule</button>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="card" style={{ maxWidth: 800 }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>Professional Information</h3>
      <div className="grid grid-cols-2 gap-5" style={{ marginBottom: 24 }}>
        {[
          { label: 'Full Name', type: 'text', val: 'Dr. Sarah Johnson' },
          { label: 'Specialty', type: 'select', val: 'cardiology', opts: ['Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'General Practice'] },
          { label: 'Years of Experience', type: 'number', val: '15' },
          { label: 'License Number', type: 'text', val: 'MD123456' },
          { label: 'Consultation Fee ($)', type: 'number', val: '150' },
          { label: 'Languages', type: 'text', val: 'English, Spanish' },
        ].map((f, i) => (
          <div key={i} className="form-group">
            <label className="form-label">{f.label}</label>
            {f.type === 'select' ? (
              <select defaultValue={f.val} className="form-select">
                {f.opts.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type} defaultValue={f.val} className="form-input" />
            )}
          </div>
        ))}
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Education & Qualifications</h3>
      <div className="grid grid-cols-2 gap-5" style={{ marginBottom: 24 }}>
        {[
          { label: 'Medical School', val: 'Harvard Medical School' },
          { label: 'Graduation Year', val: '2008', type: 'number' },
          { label: 'Residency', val: 'Massachusetts General Hospital' },
          { label: 'Fellowship', val: 'Interventional Cardiology' },
        ].map((f, i) => (
          <div key={i} className="form-group">
            <label className="form-label">{f.label}</label>
            <input type={f.type || 'text'} defaultValue={f.val} className="form-input" />
          </div>
        ))}
      </div>
      <div className="form-group">
        <label className="form-label">Bio</label>
        <textarea rows={3} defaultValue="Dr. Sarah Johnson is a board-certified cardiologist with over 15 years of experience in treating cardiovascular diseases." className="form-textarea" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary">Save Changes</button>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title="Doctor Dashboard"
      subtitle="Manage your schedule, patients, and consultations"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      sidebarLinks={sidebarLinks}
    >
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'schedule' && renderSchedule()}
      {activeTab === 'patients' && (
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Patient List</h3>
          {upcomingAppointments.map(apt => (
            <div key={apt.id} className="item-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{apt.patient}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>ID: {apt.patientId} • {apt.reason}</div>
              </div>
              <span className={`status ${apt.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}`}>{apt.status}</span>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'profile' && renderProfile()}
    </DashboardLayout>
  );
};

export default Doctor;
