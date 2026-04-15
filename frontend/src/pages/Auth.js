import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { loginUser, registerUser } from '../services/api';
import { saveSession } from '../services/session';

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
    navigate('/patient');
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await loginUser(loginForm);
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
      const response = await registerUser(registerForm);
      completeAuth(response);
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
                  Connected to Live Services
                </span>
                <h1 style={{ fontSize: '2.6rem', lineHeight: 1.05, fontWeight: 900, marginBottom: 16 }}>
                  One sign-in flow for auth and patient care
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 26 }}>
                  Create an account through `auth-service`, then manage your patient profile through `patient-service`
                  using the same secure token.
                </p>
                <div style={{ display: 'grid', gap: 14 }}>
                  {[
                    'Register or sign in with auth-service',
                    'Store your JWT session in the frontend',
                    'Create and update your patient profile from the dashboard'
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
                  {isLoginMode ? 'Welcome back' : 'Create your patient account'}
                </h2>
                <p style={{ color: 'var(--gray-500)', marginBottom: 0 }}>
                  {isLoginMode
                    ? 'Use your auth-service credentials to continue into the dashboard.'
                    : 'New accounts are created in auth-service and redirected into the patient portal.'}
                </p>
              </div>

              {errorMessage ? (
                <div
                  style={{
                    background: '#fef2f2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
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
                        disabled
                      >
                        <option value="patient">Patient</option>
                      </select>
                      <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        Public sign-up creates patient accounts only.
                      </div>
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
