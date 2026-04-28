import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { loginUser, registerUser, registerDoctor } from '../services/api';
import { saveSession, clearSession } from '../services/session';

const initialLoginState = {
  email: '',
  password: ''
};

const initialRegisterState = {
  fullName: '',
  email: '',
  password: '',
  role: 'patient'
};

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = React.useState(location.pathname === '/register' ? 'register' : 'login');
  const [loginForm, setLoginForm] = React.useState(initialLoginState);
  const [registerForm, setRegisterForm] = React.useState(initialRegisterState);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    setMode(location.pathname === '/register' ? 'register' : 'login');
    setErrorMessage('');
  }, [location.pathname]);

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
  };

  const completeAuth = (payload) => {
    saveSession({
      token: payload.data.token,
      user: payload.data.user
    });
    const role = payload.data.user?.role;
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'doctor') {
      navigate('/doctor');
    } else {
      navigate('/patient');
    }
  };


  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await loginUser(loginForm);
      if (response.data.user?.role === 'doctor' && !response.data.user?.isVerified) {
        clearSession();
        setErrorMessage('Your doctor account is pending admin approval. You cannot login yet.');
        return;
      }
      completeAuth(response);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (registerForm.role === 'doctor') {
        await registerDoctor(registerForm);
        setErrorMessage('Registration successful! Please wait for admin approval before logging in.');
        setMode('login');
        setLoginForm({ email: registerForm.email, password: registerForm.password });
        setRegisterForm(initialRegisterState);
      } else {
        const response = await registerUser(registerForm);
        completeAuth(response);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoginMode = mode === 'login';

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: '48px 0 80px' }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <div className="grid grid-cols-2 gap-6">
            <section
              className="animate-fade-in-up"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
                borderRadius: 28,
                padding: 40,
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div className="glass-orb" style={{ width: 180, height: 180, top: -30, right: -20, opacity: 0.35 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 20
                  }}
                >
                  Secure &amp; Trusted Platform
                </span>
                <h1 style={{ fontSize: '2.6rem', lineHeight: 1.05, fontWeight: 900, marginBottom: 16 }}>
                  Your health journey starts here
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 26 }}>
                  Sign in to access your personalised dashboard. Doctors go to the doctor dashboard,
                  patients to the patient portal, and admins to the admin panel.
                </p>
                <div style={{ display: 'grid', gap: 14 }}>
                  {[
                    '✦  Book appointments with certified doctors',
                    '✦  Manage your medical records securely',
                    '✦  AI-powered symptom checking'
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 18,
                        padding: '14px 16px',
                        fontWeight: 500
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="card animate-fade-in-up delay-100" style={{ padding: 36 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                <Link
                  to="/login"
                  className={`btn ${isLoginMode ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={`btn ${isLoginMode ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Create Account
                </Link>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>
                  {isLoginMode ? 'Welcome back 👋' : 'Create your account'}
                </h2>
                <p style={{ color: 'var(--gray-500)', marginBottom: 0 }}>
                  {isLoginMode
                    ? 'Sign in to continue. You\'ll be redirected to your dashboard based on your role.'
                    : 'Register as a patient to book appointments and manage your health records.'}
                </p>
              </div>

              {errorMessage ? (
                <div
                  style={{
                    background: errorMessage.includes('successful') ? '#f0fdf4' : '#fef2f2',
                    color: errorMessage.includes('successful') ? '#166534' : '#b91c1c',
                    border: `1px solid ${errorMessage.includes('successful') ? '#bbf7d0' : '#fecaca'}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    marginBottom: 18,
                    fontSize: '0.9rem'
                  }}
                >
                  {errorMessage}
                </div>
              ) : null}

              {isLoginMode ? (
                <form onSubmit={handleLoginSubmit}>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <label>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Email</div>
                      <input
                        className="input"
                        type="email"
                        name="email"
                        value={loginForm.email}
                        onChange={handleLoginChange}
                        placeholder="test.patient@example.com"
                        required
                      />
                    </label>
                    <label>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Password</div>
                      <input
                        className="input"
                        type="password"
                        name="password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        placeholder="Enter your password"
                        required
                      />
                    </label>
                    <button className="btn btn-primary btn-lg" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>
                    <Link to="/forgot-password" style={{ textAlign: 'center', color: 'var(--primary)' }}>
                      Forgot password?
                    </Link>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit}>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <label>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Full Name</div>
                      <input
                        className="input"
                        type="text"
                        name="fullName"
                        value={registerForm.fullName}
                        onChange={handleRegisterChange}
                        placeholder="Jane Doe"
                        required
                      />
                    </label>
                    <label>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Email</div>
                      <input
                        className="input"
                        type="email"
                        name="email"
                        value={registerForm.email}
                        onChange={handleRegisterChange}
                        placeholder="jane@example.com"
                        required
                      />
                    </label>
                    <label>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Password</div>
                      <input
                        className="input"
                        type="password"
                        name="password"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        placeholder="At least 6 characters"
                        minLength={6}
                        required
                      />
                    </label>
                    <label>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Role</div>
                      <select
                        className="input"
                        name="role"
                        value={registerForm.role}
                        onChange={handleRegisterChange}
                      >
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                      </select>
                    </label>
                    <button className="btn btn-primary btn-lg" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
