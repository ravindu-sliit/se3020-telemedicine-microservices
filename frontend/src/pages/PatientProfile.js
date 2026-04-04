import React from 'react';
import Navbar from '../components/Navbar';
import { createPatientProfile, fetchPatientProfile, updatePatientProfile } from '../services/api';
import { getSession } from '../services/session';

const emptyProfile = {
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  allergies: '',
  chronicConditions: '',
  address: {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  },
  emergencyContact: {
    name: '',
    relationship: '',
    phone: ''
  }
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
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const PatientProfile = () => {
  const session = React.useMemo(() => getSession(), []);
  const [form, setForm] = React.useState(emptyProfile);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasExistingProfile, setHasExistingProfile] = React.useState(false);
  const [feedback, setFeedback] = React.useState({ type: '', message: '' });

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
      } catch (error) {
        if (error.message === 'Patient profile not found') {
          setHasExistingProfile(false);
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
      [section]: {
        ...current[section],
        [name]: value
      }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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

      setForm(mapProfileToForm(response.data));
      setHasExistingProfile(true);
      setFeedback({
        type: 'success',
        message: hasExistingProfile ? 'Patient profile updated successfully.' : 'Patient profile created successfully.'
      });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsSaving(false);
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
              Your details are saved in `patient-service` and linked to your auth account.
            </p>
          </div>

          <div className="card animate-fade-in-up delay-100" style={{ padding: 28 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.8fr',
                gap: 24,
                marginBottom: 24
              }}
            >
              <div
                style={{
                  borderRadius: 24,
                  padding: 24,
                  background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
                  border: '1px solid #dbeafe'
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    background: '#2563eb',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    marginBottom: 16
                  }}
                >
                  {(session?.user?.fullName || 'P').slice(0, 1).toUpperCase()}
                </div>
                <h2 style={{ marginBottom: 8, fontSize: '1.35rem', fontWeight: 800 }}>{session?.user?.fullName || 'Guest'}</h2>
                <p style={{ color: 'var(--gray-500)', marginBottom: 18 }}>{session?.user?.email || 'Not signed in'}</p>
                <div className={`status ${hasExistingProfile ? 'status-confirmed' : 'status-pending'}`}>
                  {hasExistingProfile ? 'Profile synced' : 'Profile pending'}
                </div>
              </div>

              <div
                style={{
                  borderRadius: 24,
                  padding: 24,
                  background: '#fff7ed',
                  border: '1px solid #fed7aa'
                }}
              >
                <h3 style={{ marginBottom: 10, fontSize: '1rem', fontWeight: 800 }}>How this page works</h3>
                <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: 0 }}>
                  The form uses your auth token from `auth-service`, then creates or updates the matching patient
                  record in `patient-service` using the same `userId`.
                </p>
              </div>
            </div>

            {feedback.message ? (
              <div
                style={{
                  marginBottom: 20,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                  background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  color: feedback.type === 'success' ? '#166534' : '#b91c1c'
                }}
              >
                {feedback.message}
              </div>
            ) : null}

            {isLoading ? (
              <p style={{ margin: 0, color: 'var(--gray-500)' }}>Loading patient profile...</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-5">
                  <label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Phone</div>
                    <input className="input" name="phone" value={form.phone} onChange={updateField} />
                  </label>
                  <label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Date of Birth</div>
                    <input className="input" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={updateField} />
                  </label>
                  <label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Gender</div>
                    <select className="input" name="gender" value={form.gender} onChange={updateField}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </label>
                  <label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Blood Group</div>
                    <select className="input" name="bloodGroup" value={form.bloodGroup} onChange={updateField}>
                      <option value="">Select blood group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Allergies</div>
                    <input
                      className="input"
                      name="allergies"
                      value={form.allergies}
                      onChange={updateField}
                      placeholder="Comma separated values"
                    />
                  </label>
                  <label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Chronic Conditions</div>
                    <input
                      className="input"
                      name="chronicConditions"
                      value={form.chronicConditions}
                      onChange={updateField}
                      placeholder="Comma separated values"
                    />
                  </label>
                </div>

                <div style={{ marginTop: 28 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 14 }}>Address</h3>
                  <div className="grid grid-cols-2 gap-5">
                    <input className="input" name="street" value={form.address.street} onChange={(event) => updateNestedField('address', event)} placeholder="Street" />
                    <input className="input" name="city" value={form.address.city} onChange={(event) => updateNestedField('address', event)} placeholder="City" />
                    <input className="input" name="state" value={form.address.state} onChange={(event) => updateNestedField('address', event)} placeholder="State" />
                    <input className="input" name="postalCode" value={form.address.postalCode} onChange={(event) => updateNestedField('address', event)} placeholder="Postal code" />
                    <input className="input" name="country" value={form.address.country} onChange={(event) => updateNestedField('address', event)} placeholder="Country" />
                  </div>
                </div>

                <div style={{ marginTop: 28 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 14 }}>Emergency Contact</h3>
                  <div className="grid grid-cols-3 gap-5">
                    <input className="input" name="name" value={form.emergencyContact.name} onChange={(event) => updateNestedField('emergencyContact', event)} placeholder="Name" />
                    <input className="input" name="relationship" value={form.emergencyContact.relationship} onChange={(event) => updateNestedField('emergencyContact', event)} placeholder="Relationship" />
                    <input className="input" name="phone" value={form.emergencyContact.phone} onChange={(event) => updateNestedField('emergencyContact', event)} placeholder="Phone" />
                  </div>
                </div>

                <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-lg" type="submit" disabled={isSaving || !session?.user?.id}>
                    {isSaving ? 'Saving...' : hasExistingProfile ? 'Update Profile' : 'Create Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
