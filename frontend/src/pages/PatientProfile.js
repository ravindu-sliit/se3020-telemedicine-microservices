import React, { useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { 
  createPatientProfile, 
  fetchPatientProfile, 
  updatePatientProfile,
  uploadMedicalReport,
  updateMyAccount,
  deleteMyAccount
} from '../services/api';
import { clearSession, getSession, saveSession } from '../services/session';
import {
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const emptyProfile = {
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  allergies: '',
  chronicConditions: '',
  address: { street: '', city: '', state: '', postalCode: '', country: '' },
  emergencyContact: { name: '', relationship: '', phone: '' }
};

const mapProfileToForm = (profile) => ({
  phone: profile.phone || '',
  dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '',
  gender: profile.gender || '',
  bloodGroup: profile.bloodGroup || '',
  allergies: (profile.allergies || []).join(', '),
  chronicConditions: (profile.chronicConditions || []).join(', '),
  address: {
    street: profile.address?.street || '',
    city: profile.address?.city || '',
    state: profile.address?.state || '',
    postalCode: profile.address?.postalCode || '',
    country: profile.address?.country || ''
  },
  emergencyContact: {
    name: profile.emergencyContact?.name || '',
    relationship: profile.emergencyContact?.relationship || '',
    phone: profile.emergencyContact?.phone || ''
  }
});

const splitCsv = (value) =>
  value.split(',').map((item) => item.trim()).filter(Boolean);

const fieldLabelStyle = {
  fontSize: '0.78rem',
  fontWeight: 800,
  color: 'var(--gray-600)',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const sectionStyle = {
  borderTop: '1px solid var(--gray-100)',
  paddingTop: 26,
  marginTop: 26
};

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 18 }}>
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: 'var(--primary-50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <Icon style={{ width: 20, height: 20, color: 'var(--primary-600)' }} />
    </div>
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--gray-900)' }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.88rem', lineHeight: 1.5 }}>
        {subtitle}
      </p>
    </div>
  </div>
);

const PatientProfile = () => {
  const session = React.useMemo(() => getSession(), []);
  const [accountName, setAccountName] = React.useState(session?.user?.fullName || '');
  const [form, setForm] = React.useState(emptyProfile);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [hasExistingProfile, setHasExistingProfile] = React.useState(false);
  const [profileId, setProfileId] = React.useState('');
  const [feedback, setFeedback] = React.useState({ type: '', message: '' });

  // Medical Report Upload State
  const fileInputRef = useRef(null);
  const [reportFile, setReportFile] = useState(null);
  const [reportType, setReportType] = useState('Blood Test');
  const [reportNotes, setReportNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState({ type: '', message: '' });

  const completionFields = [
    form.phone,
    form.dateOfBirth,
    form.gender,
    form.bloodGroup,
    form.address.city,
    form.emergencyContact.name,
    form.emergencyContact.phone
  ];
  const completedFieldCount = completionFields.filter(Boolean).length;
  const completionPercent = Math.round((completedFieldCount / completionFields.length) * 100);

  React.useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) {
        setFeedback({ type: 'error', message: 'Please sign in before accessing your profile.' });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetchPatientProfile(session.user.id);
        setForm(mapProfileToForm(response.data));
        setHasExistingProfile(true);
        setProfileId(response.data?._id || '');
      } catch (error) {
        if (error.message === 'Patient profile not found') {
          setHasExistingProfile(false);
          setProfileId('');
        } else {
          setFeedback({ type: 'error', message: error.message });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [session]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateNestedField = (section, event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [section]: { ...current[section], [name]: value }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fullName = accountName.trim();

    if (!fullName) {
      setFeedback({ type: 'error', message: 'Full name is required.' });
      return;
    }

    setIsSaving(true);
    setFeedback({ type: '', message: '' });

    const payload = {
      userId: session.user.id,
      phone: form.phone,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
      bloodGroup: form.bloodGroup || undefined,
      allergies: splitCsv(form.allergies),
      chronicConditions: splitCsv(form.chronicConditions),
      address: { ...form.address },
      emergencyContact: { ...form.emergencyContact }
    };

    try {
      const response = hasExistingProfile
        ? await updatePatientProfile(session.user.id, payload)
        : await createPatientProfile(payload);
      const currentSession = getSession() || session;
      const shouldUpdateName = fullName !== currentSession?.user?.fullName;

      let updatedUser = null;
      if (shouldUpdateName) {
        const accountResponse = await updateMyAccount({ fullName });
        updatedUser = accountResponse?.data?.user || null;
      }

      if (updatedUser) {
        const updatedSession = {
          ...currentSession,
          user: {
            ...currentSession.user,
            ...updatedUser
          }
        };

        saveSession(updatedSession);
        setAccountName(updatedSession.user.fullName);
      }

      setForm(mapProfileToForm(response.data));
      setHasExistingProfile(true);
      setProfileId(response.data?._id || '');
      setFeedback({
        type: 'success',
        message: shouldUpdateName
          ? 'Name and patient profile updated successfully.'
          : hasExistingProfile
            ? 'Patient profile updated successfully.'
            : 'Patient profile created successfully.'
      });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReportUpload = async (event) => {
    event.preventDefault();
    if (!reportFile) {
      setUploadFeedback({ type: 'error', message: 'Please select a file to upload.' });
      return;
    }

    if (!profileId) {
      setUploadFeedback({ type: 'error', message: 'Please save your patient profile before uploading reports.' });
      return;
    }

    setIsUploading(true);
    setUploadFeedback({ type: '', message: '' });

    const formData = new FormData();
    formData.append('report', reportFile);
    formData.append('patientId', profileId);
    formData.append('reportType', reportType);
    formData.append('notes', reportNotes);

    try {
      await uploadMedicalReport(formData);
      setUploadFeedback({ type: 'success', message: 'Medical report uploaded successfully!' });
      
      // Reset form
      setReportFile(null);
      setReportNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      setUploadFeedback({ type: 'error', message: error.message || 'Failed to upload report.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Delete your patient account? This will remove your login access and cannot be undone.');
    if (!confirmed) return;

    setIsDeletingAccount(true);
    setFeedback({ type: '', message: '' });

    try {
      await deleteMyAccount();
      clearSession();
      window.location.href = '/';
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Failed to delete your account.' });
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: '36px 0 72px' }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <div className="dashboard-header animate-fade-in-up">
            <h1 className="dashboard-title">Patient Profile</h1>
            <p className="dashboard-subtitle" style={{ marginBottom: 0 }}>
              Keep your clinical, contact, and emergency details ready for appointments.
            </p>
          </div>

          <div className="card animate-fade-in-up delay-100" style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div style={{ borderRadius: 16, padding: 22, background: '#f8fafc', border: '1px solid var(--gray-100)' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800 }}>
                    {(accountName || 'P').slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 4px', fontSize: '1.28rem', fontWeight: 800 }}>{accountName || 'Guest'}</h2>
                    <p style={{ color: 'var(--gray-500)', margin: 0, fontSize: '0.9rem' }}>{session?.user?.email || 'Not signed in'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className={`status ${hasExistingProfile ? 'status-confirmed' : 'status-pending'}`}>
                    {hasExistingProfile ? 'Profile active' : 'Profile pending'}
                  </div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.86rem' }}>
                    Completion {completionPercent}%
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden', marginTop: 14 }}>
                  <div style={{ width: `${completionPercent}%`, height: '100%', background: '#2563eb' }} />
                </div>
              </div>

              {/* Document Upload Section */}
              {hasExistingProfile ? (
                <div style={{ borderRadius: 16, padding: 22, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <DocumentArrowUpIcon style={{ width: 24, height: 24, color: '#166534' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#166534' }}>Upload Medical Report</h3>
                  </div>
                  <p style={{ color: '#166534', fontSize: '0.88rem', lineHeight: 1.55, margin: '0 0 14px' }}>
                    Add PDF or image reports so doctors can review them before consultations.
                  </p>
                  
                  {uploadFeedback.message && (
                    <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', background: uploadFeedback.type === 'success' ? '#dcfce7' : '#fee2e2', color: uploadFeedback.type === 'success' ? '#166534' : '#991b1b' }}>
                      {uploadFeedback.message}
                    </div>
                  )}

                  <form onSubmit={handleReportUpload}>
                    <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 12 }}>
                      <select className="input" value={reportType} onChange={(e) => setReportType(e.target.value)} aria-label="Report type">
                        <option value="Blood Test">Blood Test</option>
                        <option value="X-Ray">X-Ray</option>
                        <option value="MRI">MRI Scan</option>
                        <option value="Prescription">Prescription</option>
                        <option value="Other">Other</option>
                      </select>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setReportFile(e.target.files[0])}
                        style={{ padding: '9px', fontSize: '0.85rem', background: 'white', border: '1px solid #bbf7d0', borderRadius: 12 }} 
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Add brief notes (e.g., 'Routine fasting check')" 
                      className="input" 
                      value={reportNotes} 
                      onChange={(e) => setReportNotes(e.target.value)} 
                      style={{ marginBottom: 12 }} 
                    />
                    <button type="submit" disabled={isUploading || !reportFile} className="btn btn-primary btn-sm w-full">
                      {isUploading ? 'Uploading...' : 'Upload Report'}
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ borderRadius: 16, padding: 22, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <ExclamationTriangleIcon style={{ width: 22, height: 22, color: '#c2410c' }} />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#9a3412' }}>Complete Your Profile</h3>
                  </div>
                  <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: 0 }}>
                    Please fill out and save your patient profile information below before you can upload medical reports.
                  </p>
                </div>
              )}
            </div>

            {feedback.message && (
              <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 14, border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`, background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2', color: feedback.type === 'success' ? '#166534' : '#b91c1c' }}>
                {feedback.message}
              </div>
            )}

            {isLoading ? (
              <p style={{ margin: 0, color: 'var(--gray-500)' }}>Loading patient profile...</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <SectionHeader
                  icon={UserCircleIcon}
                  title="Personal Details"
                  subtitle="Core identity information used by care teams and appointment records."
                />
                <div className="grid grid-cols-2 gap-5">
                  <label>
                    <div style={fieldLabelStyle}>Full Name</div>
                    <input
                      className="input"
                      value={accountName}
                      onChange={(event) => setAccountName(event.target.value)}
                      placeholder="Full name"
                      required
                    />
                  </label>
                  <label>
                    <div style={fieldLabelStyle}>Phone</div>
                    <input className="input" name="phone" value={form.phone} onChange={updateField} placeholder="+94 77 123 4567" required />
                  </label>
                  <label>
                    <div style={fieldLabelStyle}>Date of Birth</div>
                    <input className="input" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={updateField} required />
                  </label>
                  <label>
                    <div style={fieldLabelStyle}>Gender</div>
                    <select className="input" name="gender" value={form.gender} onChange={updateField} required>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </label>
                  <label>
                    <div style={fieldLabelStyle}>Blood Group</div>
                    <select className="input" name="bloodGroup" value={form.bloodGroup} onChange={updateField}>
                      <option value="">Select blood group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div style={sectionStyle}>
                  <SectionHeader
                    icon={HeartIcon}
                    title="Medical Background"
                    subtitle="Add known allergies and ongoing conditions as comma-separated entries."
                  />
                  <div className="grid grid-cols-2 gap-5">
                  <label>
                    <div style={fieldLabelStyle}>Allergies</div>
                    <input className="input" name="allergies" value={form.allergies} onChange={updateField} placeholder="Penicillin, peanuts" />
                  </label>
                  <label>
                    <div style={fieldLabelStyle}>Chronic Conditions</div>
                    <input className="input" name="chronicConditions" value={form.chronicConditions} onChange={updateField} placeholder="Diabetes, hypertension" />
                  </label>
                  </div>
                </div>

                <div style={sectionStyle}>
                  <SectionHeader
                    icon={MapPinIcon}
                    title="Residential Address"
                    subtitle="Used for care coordination, billing, and emergency context."
                  />
                  <div className="grid grid-cols-2 gap-5">
                    <input className="input" name="street" value={form.address.street} onChange={(event) => updateNestedField('address', event)} placeholder="Street" />
                    <input className="input" name="city" value={form.address.city} onChange={(event) => updateNestedField('address', event)} placeholder="City" />
                    <input className="input" name="state" value={form.address.state} onChange={(event) => updateNestedField('address', event)} placeholder="State" />
                    <input className="input" name="postalCode" value={form.address.postalCode} onChange={(event) => updateNestedField('address', event)} placeholder="Postal code" />
                    <input className="input" name="country" value={form.address.country} onChange={(event) => updateNestedField('address', event)} placeholder="Country" />
                  </div>
                </div>

                <div style={sectionStyle}>
                  <SectionHeader
                    icon={PhoneIcon}
                    title="Emergency Contact"
                    subtitle="A trusted contact who can be reached during urgent care situations."
                  />
                  <div className="grid grid-cols-3 gap-5">
                    <input className="input" name="name" value={form.emergencyContact.name} onChange={(event) => updateNestedField('emergencyContact', event)} placeholder="Full name" />
                    <input className="input" name="relationship" value={form.emergencyContact.relationship} onChange={(event) => updateNestedField('emergencyContact', event)} placeholder="Relationship" />
                    <input className="input" name="phone" value={form.emergencyContact.phone} onChange={(event) => updateNestedField('emergencyContact', event)} placeholder="Phone number" />
                  </div>
                </div>

                <div style={{ ...sectionStyle, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--gray-500)', fontSize: '0.88rem' }}>
                    <ShieldCheckIcon style={{ width: 20, height: 20, color: '#16a34a' }} />
                    Your profile is linked to your signed-in account.
                  </div>
                  <button className="btn btn-primary btn-lg" type="submit" disabled={isSaving || !session?.user?.id}>
                    {isSaving ? 'Saving...' : hasExistingProfile ? 'Update Profile' : 'Create Profile'}
                  </button>
                </div>
              </form>
            )}

            {!isLoading && session?.user?.id ? (
              <div
                style={{
                  ...sectionStyle,
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
                    Permanently remove your patient login account from MediConnect.
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
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
