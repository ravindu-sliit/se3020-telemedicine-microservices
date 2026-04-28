import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { resetPassword } from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = React.useState(searchParams.get('token') || '');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState({ type: '', message: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: '', message: '' });

    if (password !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword({ token, password });
      setFeedback({ type: 'success', message: response.message });
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: '48px 0 80px' }}>
        <div className="container" style={{ maxWidth: 520 }}>
          <section className="card animate-fade-in-up" style={{ padding: 36 }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 8 }}>Reset Password</h1>
              <p style={{ color: 'var(--gray-500)', marginBottom: 0 }}>
                Set a new password for your account.
              </p>
            </div>

            {feedback.message ? (
              <div
                style={{
                  background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  color: feedback.type === 'success' ? '#166534' : '#b91c1c',
                  border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: 14,
                  padding: '12px 14px',
                  marginBottom: 18,
                  fontSize: '0.9rem'
                }}
              >
                {feedback.message}
              </div>
            ) : null}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: 16 }}>
                <label>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Reset Token</div>
                  <input
                    className="input"
                    type="text"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="Paste reset token"
                    required
                  />
                </label>
                <label>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>New Password</div>
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                  />
                </label>
                <label>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>Confirm Password</div>
                  <input
                    className="input"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat new password"
                    minLength={6}
                    required
                  />
                </label>
                <button className="btn btn-primary btn-lg" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </button>
                <Link to="/login" style={{ textAlign: 'center', color: 'var(--primary)' }}>
                  Back to sign in
                </Link>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
