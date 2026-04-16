import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { confirmCheckoutSession } from '../services/api';

const PaymentStatus = ({ isSuccess }) => {
  const location = useLocation();
  const [notifyError, setNotifyError] = useState('');

  const sessionId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('session_id');
  }, [location.search]);

  useEffect(() => {
    if (!isSuccess || !sessionId) return;

    const notificationKey = `payment-notified-${sessionId}`;
    if (window.localStorage.getItem(notificationKey) === 'done') return;

    const notify = async () => {
      try {
        await confirmCheckoutSession(sessionId);
        window.localStorage.setItem(notificationKey, 'done');
      } catch (error) {
        setNotifyError(error.message || 'Payment succeeded, but confirmation email could not be sent.');
      }
    };

    notify();
  }, [isSuccess, sessionId]);

  const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;
  const title = isSuccess ? 'Payment Successful' : 'Payment Cancelled';
  const subtitle = isSuccess
    ? 'Your Stripe payment is complete. You can now continue with your appointment.'
    : 'No payment was charged. You can return and try again.';

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: '32px 0 60px' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="card" style={{ textAlign: 'center', padding: 44 }}>
            <div
              className="animate-scale-in"
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: isSuccess ? 'var(--success-50)' : '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px'
              }}
            >
              <Icon style={{ width: 38, height: 38, color: isSuccess ? 'var(--success-600)' : '#dc2626' }} />
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>{title}</h1>
            <p style={{ color: 'var(--gray-500)', marginBottom: 22 }}>{subtitle}</p>

            {sessionId && (
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginBottom: 22 }}>
                Session: {sessionId}
              </p>
            )}

            {notifyError && (
              <div style={{ marginBottom: 16, color: '#b91c1c', fontSize: '0.9rem' }}>{notifyError}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Link to="/patient" className="btn btn-secondary">
                Go to Dashboard
              </Link>
              <Link to="/patient/book-appointment" className="btn btn-primary">
                {isSuccess ? 'Book Another' : 'Try Payment Again'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PaymentSuccess = () => <PaymentStatus isSuccess />;
export const PaymentCancel = () => <PaymentStatus isSuccess={false} />;
