import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  UserGroupIcon,
  CheckCircleIcon, XCircleIcon, Squares2X2Icon,
  ShieldCheckIcon, ChartBarIcon, BanknotesIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../components/DashboardLayout';
import {
  approveDoctorApplication,
  fetchPendingDoctorApplications,
  rejectDoctorApplication,
  fetchAllUsers,
  updateUserRole,
  verifyAuthDoctor,
  rejectAuthDoctor
} from '../services/api';


const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return dateValue;

  return parsedDate.toISOString().slice(0, 10);
};

const formatCurrency = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return '$0';

  return `$${numberValue.toLocaleString()}`;
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingApplications, setPendingApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionState, setActionState] = useState({ doctorId: '', action: '' });
  const [feedback, setFeedback] = useState('');

  const [allUsers, setAllUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Squares2X2Icon },
    { id: 'users', label: 'User Management', icon: UserGroupIcon },
    { id: 'verification', label: 'Verification', icon: ShieldCheckIcon }
  ];

  const loadPendingApplications = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await fetchPendingDoctorApplications();
      const records = Array.isArray(response?.data) ? response.data : [];
      setPendingApplications(records);
    } catch (error) {
      setPendingApplications([]);
      setLoadError(error.message || 'Unable to fetch pending doctor applications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAllUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const response = await fetchAllUsers();
      setAllUsers(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingApplications();
    loadAllUsers();
  }, [loadPendingApplications, loadAllUsers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      await loadAllUsers();
      setFeedback(`User role successfully changed to ${newRole}.`);
      
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(''), 3000);
    } catch (error) {
      setFeedback(error.message || 'Failed to update user role.');
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const platformStats = useMemo(() => {
    const pendingCount = pendingApplications.length;
    const avgFee =
      pendingCount === 0
        ? 0
        : pendingApplications.reduce((sum, current) => sum + (Number(current.consultationFee) || 0), 0) / pendingCount;

    const totalExperienceYears = pendingApplications.reduce(
      (sum, current) => sum + (Number(current.yearsOfExperience) || 0),
      0
    );

    const latestSubmissionDate = pendingApplications.reduce((latest, current) => {
      const submittedAt = current.submittedAt || '';
      if (!latest) return submittedAt;
      return new Date(submittedAt) > new Date(latest) ? submittedAt : latest;
    }, '');

    return {
      pendingCount,
      avgFee,
      totalExperienceYears,
      latestSubmissionDate
    };
  }, [pendingApplications]);

  const unverifiedSignups = useMemo(
    () =>
      allUsers
        .filter((user) => user.role === 'doctor' && user.isVerified === false)
        .map((user) => ({
          id: user.id || user._id,
          type: 'auth',
          name: user.fullName || 'N/A',
          email: user.email || 'N/A',
          specialty: 'Pending Profile',
          licenseNumber: 'N/A',
          experience: 'N/A',
          medicalSchool: 'N/A',
          submissionDate: 'New Registration',
          status: 'pending verification',
          consultationFee: 0,
          bio: 'Please approve to unblock doctor dashboard access.'
        })),
    [allUsers]
  );

  const doctorVerificationRequests = useMemo(
    () =>
      pendingApplications.map((application) => ({
        id: application._id,
        type: 'application',
        name: application.userId || 'N/A',
        email: application.userId || 'N/A',
        specialty: application.specialty || 'N/A',
        licenseNumber: application.medicalLicenseNumber || 'N/A',
        experience: Number.isFinite(Number(application.yearsOfExperience))
          ? `${application.yearsOfExperience} years`
          : 'N/A',
        medicalSchool:
          Array.isArray(application.qualifications) && application.qualifications.length > 0
            ? application.qualifications.join(', ')
            : 'N/A',
        submissionDate: formatDate(application.submittedAt),
        status: application.verificationStatus || 'N/A',
        consultationFee: Number(application.consultationFee) || 0,
        bio: application.bio || 'N/A'
      })),
    [pendingApplications]
  );

  const combinedVerificationRequests = useMemo(
    () => [...unverifiedSignups, ...doctorVerificationRequests],
    [unverifiedSignups, doctorVerificationRequests]
  );

  const handleDoctorVerification = async (doctorId, action, type) => {
    setActionState({ doctorId, action });
    setFeedback('');

    try {
      if (type === 'auth') {
        if (action === 'approve') {
          await verifyAuthDoctor(doctorId);
        } else {
          await rejectAuthDoctor(doctorId);
        }
      } else {
        if (action === 'approve') {
          await approveDoctorApplication({ doctorId, verificationNotes: 'Approved by admin dashboard' });
        } else {
          await rejectDoctorApplication({ doctorId, verificationNotes: 'Rejected by admin dashboard' });
        }
      }

      setFeedback(`Doctor ${type === 'auth' ? 'registration' : 'application'} ${action}d successfully.`);
      await loadPendingApplications();
      await loadAllUsers();
    } catch (error) {
      setFeedback(error.message || `Failed to ${action} doctor.`);
    } finally {
      setActionState({ doctorId: '', action: '' });
    }
  };

  const renderDashboard = () => (
    <div>
      <div className="grid grid-cols-3 gap-5" style={{ marginBottom: 32 }}>
        {[
          {
            label: 'Pending Applications',
            value: String(platformStats.pendingCount),
            color: '#4f46e5',
            bg: '#eef2ff',
            icon: ShieldCheckIcon
          },
          {
            label: 'Average Fee',
            value: formatCurrency(Math.round(platformStats.avgFee)),
            color: '#10b981',
            bg: '#ecfdf5',
            icon: BanknotesIcon
          },
          {
            label: 'Experience Pool',
            value: `${platformStats.totalExperienceYears}y`,
            color: '#0ea5e9',
            bg: '#f0f9ff',
            icon: UserGroupIcon
          },
          {
            label: 'Latest Submission',
            value: platformStats.latestSubmissionDate ? formatDate(platformStats.latestSubmissionDate) : 'N/A',
            color: '#7c3aed',
            bg: '#f5f3ff',
            icon: ChartBarIcon
          }
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 20, height: 20, color: s.color }} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 500 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Backend Verification Feed</h3>
          {isLoading ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Loading pending applications...</div>
          ) : combinedVerificationRequests.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No pending doctor applications right now.</div>
          ) : (
            combinedVerificationRequests.map((request) => (
              <div key={request.id + request.type} className="item-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{request.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    {request.specialty} • {request.submissionDate}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 2 }}>
                    {formatCurrency(request.consultationFee)}
                  </div>
                  <span className="status status-pending">{request.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Verification Actions</h3>
          {feedback ? (
            <div
              style={{
                marginBottom: 12,
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${feedback.includes('Failed') || feedback.includes('Unable') ? '#fecaca' : '#bbf7d0'}`,
                background: feedback.includes('Failed') || feedback.includes('Unable') ? '#fef2f2' : '#f0fdf4',
                color: feedback.includes('Failed') || feedback.includes('Unable') ? '#b91c1c' : '#166534',
                fontSize: '0.85rem'
              }}
            >
              {feedback}
            </div>
          ) : null}
          {loadError ? (
            <div style={{ color: '#b91c1c', fontSize: '0.9rem' }}>{loadError}</div>
          ) : combinedVerificationRequests.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No verification actions required.</div>
          ) : (
            combinedVerificationRequests.map((request) => (
              <div key={request.id + request.type} className="item-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{request.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{request.specialty} • {request.experience}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{request.submissionDate}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleDoctorVerification(request.id, 'approve', request.type)}
                    disabled={actionState.doctorId === request.id}
                  >
                    <CheckCircleIcon style={{ width: 14, height: 14 }} />
                    {actionState.doctorId === request.id && actionState.action === 'approve' ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDoctorVerification(request.id, 'reject', request.type)}
                    disabled={actionState.doctorId === request.id}
                  >
                    <XCircleIcon style={{ width: 14, height: 14 }} />
                    {actionState.doctorId === request.id && actionState.action === 'reject' ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="card">
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Platform Users</h3>
      {feedback && activeTab === 'users' ? (
        <div style={{ marginBottom: 16, padding: '10px', borderRadius: 8, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
          {feedback}
        </div>
      ) : null}
      
      {isUsersLoading ? (
        <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Loading users...</div>
      ) : allUsers.length === 0 ? (
        <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No users found.</div>
      ) : (
        <div className="space-y-3">
          {allUsers.map((user) => (
            <div key={user.id} className="item-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserGroupIcon style={{ width: 18, height: 18, color: 'var(--primary-600)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{user.fullName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{user.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`status ${user.role === 'admin' ? 'status-confirmed' : user.role === 'doctor' ? 'status-pending' : 'status-inactive'}`}>
                  {user.role}
                </span>
                <select 
                  className="form-input" 
                  value={user.role} 
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  style={{ padding: '6px 28px 6px 12px', fontSize: '0.85rem', width: 120, height: 'auto', minHeight: 32 }}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderVerification = () => (
    <div className="card">
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Doctor Verification Requests</h3>
      {isLoading || isUsersLoading ? (
        <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Loading verification requests...</div>
      ) : combinedVerificationRequests.length === 0 ? (
        <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No pending requests available.</div>
      ) : (
        combinedVerificationRequests.map((request) => (
          <div
            key={request.id + request.type}
            style={{
              padding: 20,
              border: '1px solid var(--gray-100)',
              borderRadius: 16,
              marginBottom: 16,
              background: 'var(--gray-50)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-900)', marginBottom: 4 }}>{request.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{request.email}</div>
              </div>
              <span className="status status-pending">{request.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
              {[
                { l: 'Specialty', v: request.specialty },
                { l: 'Experience', v: request.experience },
                { l: 'License #', v: request.licenseNumber },
                { l: 'Qualifications', v: request.medicalSchool },
                { l: 'Consultation Fee', v: formatCurrency(request.consultationFee) },
                { l: 'Submitted', v: request.submissionDate }
              ].map((detail, index) => (
                <div key={index}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--gray-400)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 2
                    }}
                  >
                    {detail.l}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--gray-700)', fontWeight: 500 }}>{detail.v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16, color: 'var(--gray-600)', fontSize: '0.85rem' }}>{request.bio}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-success btn-sm"
                onClick={() => handleDoctorVerification(request.id, 'approve', request.type)}
                disabled={actionState.doctorId === request.id}
              >
                <CheckCircleIcon style={{ width: 14, height: 14 }} />
                {actionState.doctorId === request.id && actionState.action === 'approve' ? 'Approving...' : 'Approve'}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDoctorVerification(request.id, 'reject', request.type)}
                disabled={actionState.doctorId === request.id}
              >
                <XCircleIcon style={{ width: 14, height: 14 }} />
                {actionState.doctorId === request.id && actionState.action === 'reject' ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        ))
      )}
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
    </DashboardLayout>
  );
};

export default Admin;
