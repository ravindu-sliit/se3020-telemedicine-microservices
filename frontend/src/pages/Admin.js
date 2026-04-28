import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  UserGroupIcon,
  CheckCircleIcon, XCircleIcon, Squares2X2Icon,
  ShieldCheckIcon, ChartBarIcon, BanknotesIcon, TrashIcon, PencilSquareIcon, PlusIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../components/DashboardLayout';
import {
  approveDoctorApplication,
  fetchPendingDoctorApplications,
  rejectDoctorApplication,
  fetchAllUsers,
  createUserAccount,
  updateUserAccount,
  updateUserRole,
  verifyAuthDoctor,
  rejectAuthDoctor,
  deleteUserAccount,
  fetchAppointmentsAdminOverview,
  fetchReportsAdminOverview,
  fetchServiceHealthSummary
} from '../services/api';
import { getSession } from '../services/session';


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

const emptyUserForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'patient',
  status: 'active',
  isVerified: false
};

const Admin = () => {
  const session = useMemo(() => getSession(), []);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingApplications, setPendingApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionState, setActionState] = useState({ doctorId: '', action: '' });
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('success');

  const [allUsers, setAllUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [userFormMode, setUserFormMode] = useState('');
  const [editingUserId, setEditingUserId] = useState('');
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    verification: 'all'
  });
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsError, setOperationsError] = useState('');
  const [operationsData, setOperationsData] = useState({
    appointments: { totalAppointments: 0, byStatus: [], byPaymentStatus: [], latestAppointments: [] },
    reports: { totalReports: 0, reportsByType: [], latestUploads: [] },
    services: []
  });

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Squares2X2Icon },
    { id: 'users', label: 'User Management', icon: UserGroupIcon },
    { id: 'verification', label: 'Verification', icon: ShieldCheckIcon },
    { id: 'operations', label: 'Operations', icon: ChartBarIcon }
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

  const loadOperations = useCallback(async () => {
    setOperationsLoading(true);
    setOperationsError('');
    try {
      const [appointmentsResult, reportsResult, servicesResult] = await Promise.allSettled([
        fetchAppointmentsAdminOverview(),
        fetchReportsAdminOverview(),
        fetchServiceHealthSummary()
      ]);

      const appointmentsResponse =
        appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : null;
      const reportsResponse = reportsResult.status === 'fulfilled' ? reportsResult.value : null;
      const servicesResponse = servicesResult.status === 'fulfilled' ? servicesResult.value : null;
      const failedMessages = [appointmentsResult, reportsResult, servicesResult]
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason?.message || 'Failed to load an operations metric');

      setOperationsData({
        appointments: appointmentsResponse?.data || {
          totalAppointments: 0,
          byStatus: [],
          byPaymentStatus: [],
          latestAppointments: []
        },
        reports: reportsResponse?.data || {
          totalReports: 0,
          reportsByType: [],
          latestUploads: []
        },
        services: Array.isArray(servicesResponse?.data) ? servicesResponse.data : []
      });

      if (failedMessages.length > 0) {
        setOperationsError(failedMessages.join(' '));
      }
    } catch (error) {
      setOperationsError(error.message || 'Failed to load operations overview.');
    } finally {
      setOperationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingApplications();
    loadAllUsers();
    loadOperations();
  }, [loadPendingApplications, loadAllUsers, loadOperations]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      await loadAllUsers();
      setFeedbackType('success');
      setFeedback(`User role successfully changed to ${newRole}.`);
      
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(''), 3000);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error.message || 'Failed to update user role.');
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const resetUserForm = () => {
    setUserForm(emptyUserForm);
    setUserFormMode('');
    setEditingUserId('');
    setSavingUser(false);
  };

  const handleStartCreateUser = () => {
    setFeedback('');
    setUserForm(emptyUserForm);
    setEditingUserId('');
    setUserFormMode('create');
  };

  const handleStartEditUser = (user) => {
    const userId = user.id || user._id;
    if (!userId) return;

    setFeedback('');
    setEditingUserId(userId);
    setUserFormMode('edit');
    setUserForm({
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      role: user.role || 'patient',
      status: user.status || 'active',
      isVerified: Boolean(user.isVerified)
    });
  };

  const handleUserFormChange = (event) => {
    const { name, type, checked, value } = event.target;
    setUserForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUserFilterChange = (event) => {
    const { name, value } = event.target;
    setUserFilters((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleUserFormSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');

    if (userFormMode === 'create' && !userForm.password.trim()) {
      setFeedbackType('error');
      setFeedback('Password is required for new users.');
      return;
    }

    const payload = {
      fullName: userForm.fullName.trim(),
      email: userForm.email.trim(),
      role: userForm.role,
      status: userForm.status,
      isVerified: userForm.role === 'admin' ? true : userForm.isVerified
    };

    if (userForm.password.trim()) {
      payload.password = userForm.password;
    }

    setSavingUser(true);

    try {
      if (userFormMode === 'edit') {
        await updateUserAccount(editingUserId, payload);
      } else {
        await createUserAccount(payload);
      }

      await loadAllUsers();
      setFeedbackType('success');
      setFeedback(userFormMode === 'edit' ? 'User updated successfully.' : 'User created successfully.');
      resetUserForm();
      setTimeout(() => setFeedback(''), 3000);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error.message || 'Failed to save user.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const userId = user.id || user._id;
    if (!userId) return;

    if (userId === session?.user?.id) {
      setFeedbackType('error');
      setFeedback('You cannot delete your own admin account.');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }

    const confirmed = window.confirm(`Delete ${user.fullName || user.email || 'this user'}? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingUserId(userId);
    setFeedback('');

    try {
      await deleteUserAccount(userId);
      await loadAllUsers();
      setFeedbackType('success');
      setFeedback('User profile deleted successfully.');
      setTimeout(() => setFeedback(''), 3000);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error.message || 'Failed to delete user profile.');
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setDeletingUserId('');
    }
  };

  const filteredUsers = useMemo(() => {
    const query = userFilters.search.trim().toLowerCase();

    return allUsers.filter((user) => {
      const status = user.status || 'active';
      const searchableValues = [user.fullName, user.email, user.role, status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || searchableValues.includes(query);
      const matchesRole = userFilters.role === 'all' || user.role === userFilters.role;
      const matchesStatus = userFilters.status === 'all' || status === userFilters.status;
      const matchesVerification =
        userFilters.verification === 'all' ||
        (userFilters.verification === 'verified' && user.isVerified) ||
        (userFilters.verification === 'unverified' && !user.isVerified);

      return matchesSearch && matchesRole && matchesStatus && matchesVerification;
    });
  }, [allUsers, userFilters]);

  const visibleUserCount = filteredUsers.length;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Platform Users</h3>
        <button className="btn btn-primary btn-sm" type="button" onClick={handleStartCreateUser}>
          <PlusIcon style={{ width: 14, height: 14 }} />
          New User
        </button>
      </div>

      {feedback && activeTab === 'users' ? (
        <div
          style={{
            marginBottom: 16,
            padding: '10px',
            borderRadius: 8,
            background: feedbackType === 'error' ? '#fef2f2' : '#f0fdf4',
            color: feedbackType === 'error' ? '#b91c1c' : '#166534',
            border: `1px solid ${feedbackType === 'error' ? '#fecaca' : '#bbf7d0'}`
          }}
        >
          {feedback}
        </div>
      ) : null}

      {userFormMode ? (
        <form
          onSubmit={handleUserFormSubmit}
          style={{
            padding: 18,
            border: '1px solid var(--gray-100)',
            borderRadius: 12,
            background: '#f8fafc',
            marginBottom: 18
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>
              {userFormMode === 'edit' ? 'Edit User' : 'Create User'}
            </h4>
            <button className="btn btn-secondary btn-sm" type="button" onClick={resetUserForm} disabled={savingUser}>
              <XMarkIcon style={{ width: 14, height: 14 }} />
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 14 }}>
            <label>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6 }}>Full Name</div>
              <input
                className="form-input"
                name="fullName"
                value={userForm.fullName}
                onChange={handleUserFormChange}
                required
              />
            </label>
            <label>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6 }}>Email</div>
              <input
                className="form-input"
                type="email"
                name="email"
                value={userForm.email}
                onChange={handleUserFormChange}
                required
              />
            </label>
            <label>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6 }}>
                {userFormMode === 'edit' ? 'New Password' : 'Password'}
              </div>
              <input
                className="form-input"
                type="password"
                name="password"
                value={userForm.password}
                onChange={handleUserFormChange}
                minLength={6}
                required={userFormMode === 'create'}
                placeholder={userFormMode === 'edit' ? 'Leave blank to keep current' : 'At least 6 characters'}
              />
            </label>
            <label>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6 }}>Role</div>
              <select className="form-input" name="role" value={userForm.role} onChange={handleUserFormChange}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6 }}>Status</div>
              <select className="form-input" name="status" value={userForm.status} onChange={handleUserFormChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24, fontSize: '0.9rem', fontWeight: 700 }}>
              <input
                type="checkbox"
                name="isVerified"
                checked={userForm.role === 'admin' ? true : userForm.isVerified}
                onChange={handleUserFormChange}
                disabled={userForm.role === 'admin'}
              />
              Verified
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn btn-primary btn-sm" type="submit" disabled={savingUser}>
              {savingUser ? 'Saving...' : userFormMode === 'edit' ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid grid-cols-4 gap-3" style={{ marginBottom: 12 }}>
        <input
          className="form-input"
          name="search"
          value={userFilters.search}
          onChange={handleUserFilterChange}
          placeholder="Search users"
          aria-label="Search users"
        />
        <select className="form-input" name="role" value={userFilters.role} onChange={handleUserFilterChange} aria-label="Filter by role">
          <option value="all">All roles</option>
          <option value="patient">Patients</option>
          <option value="doctor">Doctors</option>
          <option value="admin">Admins</option>
        </select>
        <select className="form-input" name="status" value={userFilters.status} onChange={handleUserFilterChange} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          className="form-input"
          name="verification"
          value={userFilters.verification}
          onChange={handleUserFilterChange}
          aria-label="Filter by verification"
        >
          <option value="all">All verification</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      <div style={{ color: 'var(--gray-500)', fontSize: '0.82rem', marginBottom: 14 }}>
        Showing {visibleUserCount} of {allUsers.length} users
      </div>

      {isUsersLoading ? (
        <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Loading users...</div>
      ) : allUsers.length === 0 ? (
        <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No users found.</div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No users match the selected filters.</div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const userId = user.id || user._id;
            const status = user.status || 'active';
            const isCurrentUser = session?.user?.id === userId;

            return (
              <div
                key={userId}
                className="item-row"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserGroupIcon style={{ width: 18, height: 18, color: 'var(--primary-600)' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{user.fullName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{user.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span className={`status ${user.role === 'admin' ? 'status-confirmed' : user.role === 'doctor' ? 'status-pending' : 'status-active'}`}>
                    {user.role}
                  </span>
                  <span className={`status ${status === 'active' ? 'status-confirmed' : 'status-inactive'}`}>
                    {status}
                  </span>
                  <span className={`status ${user.isVerified ? 'status-confirmed' : 'status-pending'}`}>
                    {user.isVerified ? 'verified' : 'unverified'}
                  </span>
                  <select
                    className="form-input"
                    value={user.role}
                    onChange={(e) => handleRoleChange(userId, e.target.value)}
                    style={{ padding: '6px 28px 6px 12px', fontSize: '0.85rem', width: 120, height: 'auto', minHeight: 32 }}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={() => handleStartEditUser(user)}
                    style={{ minWidth: 78, justifyContent: 'center' }}
                  >
                    <PencilSquareIcon style={{ width: 14, height: 14 }} />
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    type="button"
                    onClick={() => handleDeleteUser(user)}
                    disabled={deletingUserId === userId || isCurrentUser}
                    title={isCurrentUser ? 'You cannot delete your own account' : 'Delete user profile'}
                    style={{ minWidth: 92, justifyContent: 'center' }}
                  >
                    <TrashIcon style={{ width: 14, height: 14 }} />
                    {deletingUserId === userId ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
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

  const renderOperations = () => {
    const appointmentStatusMap = Object.fromEntries(
      (operationsData.appointments.byStatus || []).map((item) => [String(item.status || '').toLowerCase(), item.count])
    );

    const serviceHealthyCount = (operationsData.services || []).filter((service) => service.status === 'healthy').length;

    return (
      <div>
        <div className="grid grid-cols-4 gap-5" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Total Appointments</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gray-900)' }}>
              {operationsData.appointments.totalAppointments || 0}
            </div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Completed Appointments</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gray-900)' }}>
              {appointmentStatusMap.completed || 0}
            </div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Uploaded Reports</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gray-900)' }}>
              {operationsData.reports.totalReports || 0}
            </div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Healthy Services</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gray-900)' }}>
              {serviceHealthyCount}/{operationsData.services.length || 0}
            </div>
          </div>
        </div>

        {operationsLoading ? (
          <div className="card">Loading operations metrics...</div>
        ) : operationsError ? (
          <div
            className="card"
            style={{
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: '0.9rem'
            }}
          >
            {operationsError}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Appointment Status Mix</h3>
              {(operationsData.appointments.byStatus || []).length === 0 ? (
                <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No appointment data available.</div>
              ) : (
                (operationsData.appointments.byStatus || []).map((item, index) => (
                  <div key={index} className="item-row">
                    <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{item.status || 'Unknown'}</div>
                    <span className="status status-confirmed">{item.count}</span>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Service Health</h3>
              {(operationsData.services || []).length === 0 ? (
                <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No service health data available.</div>
              ) : (
                operationsData.services.map((service, index) => (
                  <div key={index} className="item-row">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{service.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{service.details}</div>
                    </div>
                    <span className={`status ${service.status === 'healthy' ? 'status-confirmed' : 'status-inactive'}`}>
                      {service.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Recent Appointments</h3>
              {(operationsData.appointments.latestAppointments || []).length === 0 ? (
                <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No recent appointments found.</div>
              ) : (
                operationsData.appointments.latestAppointments.map((appointment, index) => (
                  <div key={appointment._id || index} className="item-row">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                        {appointment.patientName || appointment.patientId || 'Patient'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                        {appointment.doctorName || appointment.doctorId || 'Doctor'} • {formatDate(appointment.appointmentDate)}
                      </div>
                    </div>
                    <span className="status status-pending">{appointment.status || 'Pending'}</span>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Recent Report Uploads</h3>
              {(operationsData.reports.latestUploads || []).length === 0 ? (
                <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No recent report uploads found.</div>
              ) : (
                operationsData.reports.latestUploads.map((report, index) => (
                  <div key={report._id || index} className="item-row">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{report.reportType || 'Report'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                        {report.fileName || 'Unnamed file'} • {formatDate(report.uploadedAt)}
                      </div>
                    </div>
                    <span className="status status-confirmed">Uploaded</span>
                  </div>
                ))
              )}
            </div>

            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Disputes & Incidents</h3>
              <div style={{ color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                Dispute tracking is not yet integrated into a dedicated microservice. This panel is reserved for future incident workflows.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
      {activeTab === 'operations' && renderOperations()}
    </DashboardLayout>
  );
};

export default Admin;
