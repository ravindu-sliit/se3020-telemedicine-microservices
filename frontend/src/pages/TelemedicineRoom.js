import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  PhoneXMarkIcon,
  UserIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import {
  fetchTelemedicineSession,
  updateTelemedicineSessionStatus
} from '../services/api';
import { getSession } from '../services/session';

const formatAppointmentDate = (appointment) => {
  if (!appointment?.appointmentDate) {
    return 'Date not available';
  }

  const date = new Date(appointment.appointmentDate);
  if (Number.isNaN(date.getTime())) {
    return 'Date not available';
  }

  return `${date.toLocaleDateString()}${appointment.timeSlot ? ` at ${appointment.timeSlot}` : ''}`;
};

const participantName = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value.fullName || value.name || fallback;
};

const TelemedicineRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useMemo(() => getSession(), []);
  const queryAppointmentId = new URLSearchParams(location.search).get('appointmentId') || '';
  const initialAppointment = location.state?.appointment || null;
  const appointmentId = initialAppointment?._id || initialAppointment?.appointmentId || queryAppointmentId;

  const [appointment, setAppointment] = useState(initialAppointment);
  const [videoSession, setVideoSession] = useState(null);
  const [meetingUrl, setMeetingUrl] = useState(initialAppointment?.videoMeetingUrl || '');
  const [isLoading, setIsLoading] = useState(Boolean(appointmentId && !initialAppointment?.videoMeetingUrl));
  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const timerRef = useRef(null);

  const roleHome = session?.user?.role === 'doctor' ? '/doctor' : '/patient';

  useEffect(() => {
    const loadSession = async () => {
      if (!appointmentId) {
        setError('Open this room from a confirmed appointment so the consultation session can be verified.');
        setIsLoading(false);
        return;
      }

      if (initialAppointment?.videoMeetingUrl) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        const response = await fetchTelemedicineSession(appointmentId);
        const data = response?.data || {};
        setVideoSession(data);
        setMeetingUrl(data.videoMeetingUrl || '');
        setAppointment((current) => current || {
          _id: data.appointmentId,
          patientId: data.patientId,
          doctorId: data.doctorId,
          videoMeetingUrl: data.videoMeetingUrl,
          status: data.status
        });
      } catch (loadError) {
        setError(loadError.message || 'Unable to load the video consultation session.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [appointmentId, initialAppointment]);

  useEffect(() => {
    if (!isConnected) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
      return undefined;
    }

    timerRef.current = window.setInterval(() => {
      setSessionTime((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isConnected]);

  const updateLifecycle = useCallback(async (status) => {
    if (!appointmentId) return;

    try {
      const response = await updateTelemedicineSessionStatus(appointmentId, status);
      setVideoSession(response?.data || null);
      setWarning('');
    } catch (statusError) {
      setWarning(statusError.message || `Unable to mark the consultation as ${status.toLowerCase()}.`);
    }
  }, [appointmentId]);

  const handleJoin = async () => {
    if (!meetingUrl) {
      setError('Meeting link is not ready yet. Ask the doctor to confirm the appointment first.');
      return;
    }

    setIsJoining(true);
    await updateLifecycle('Active');
    setIsConnected(true);
    setIsJoining(false);
  };

  const handleLeave = async () => {
    if (isConnected) {
      await updateLifecycle('Ended');
    }
    navigate(roleHome);
  };

  const openInNewTab = () => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  const doctorName = participantName(appointment?.doctorId, appointment?.doctorName || 'Doctor');
  const patientName = participantName(appointment?.patientId, appointment?.patientName || session?.user?.fullName || 'Patient');

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'var(--font-sans)' }}>
      <div
        style={{
          height: 64,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15,23,42,0.94)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={handleLeave}
            style={{
              width: 40,
              height: 40,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 10,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Back"
          >
            <ArrowLeftIcon style={{ width: 18, height: 18 }} />
          </button>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>Video Consultation</div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.62)' }}>
              {doctorName} with {patientName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', color: 'rgba(255,255,255,0.78)' }}>
            <ClockIcon style={{ width: 16, height: 16 }} />
            <span style={{ fontWeight: 700 }}>{formatTime(sessionTime)}</span>
          </div>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 800,
              background: isConnected ? 'rgba(16,185,129,0.16)' : 'rgba(245,158,11,0.16)',
              color: isConnected ? '#6ee7b7' : '#fcd34d'
            }}
          >
            {isConnected ? 'Live' : videoSession?.status || 'Ready'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: 'calc(100vh - 64px)' }}>
        <main style={{ position: 'relative', background: '#020617' }}>
          {isLoading ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="loading-state" style={{ color: 'rgba(255,255,255,0.72)' }}>Loading consultation room...</div>
            </div>
          ) : error ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <div style={{ maxWidth: 520, textAlign: 'center' }}>
                <VideoCameraIcon style={{ width: 56, height: 56, color: 'rgba(255,255,255,0.28)', marginBottom: 16 }} />
                <h1 style={{ fontSize: '1.4rem', marginBottom: 10 }}>Consultation Not Available</h1>
                <p style={{ color: 'rgba(255,255,255,0.64)', lineHeight: 1.6, marginBottom: 22 }}>{error}</p>
                <button type="button" className="btn btn-primary" onClick={() => navigate(roleHome)}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : !isConnected ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <div style={{ maxWidth: 520, textAlign: 'center' }}>
                <div
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 24,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 22px'
                  }}
                >
                  <VideoCameraIcon style={{ width: 42, height: 42, color: 'rgba(255,255,255,0.52)' }} />
                </div>
                <h1 style={{ fontSize: '1.55rem', marginBottom: 10 }}>Ready to Join</h1>
                <p style={{ color: 'rgba(255,255,255,0.64)', lineHeight: 1.6, marginBottom: 24 }}>
                  Your secure meeting room is ready. Allow camera and microphone access when the browser asks.
                </p>
                {warning && (
                  <div style={{ marginBottom: 16, color: '#fcd34d', fontSize: '0.88rem' }}>{warning}</div>
                )}
                <button type="button" className="btn btn-primary btn-lg" onClick={handleJoin} disabled={isJoining || !meetingUrl}>
                  <VideoCameraIcon style={{ width: 18, height: 18 }} />
                  {isJoining ? 'Joining...' : 'Join Secure Meeting'}
                </button>
              </div>
            </div>
          ) : (
            <iframe
              title="MediConnect video consultation"
              src={meetingUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
              style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#020617' }}
            />
          )}
        </main>

        <aside
          style={{
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            background: '#111827',
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 18
          }}
        >
          <section>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 14px' }}>Appointment</h2>
            <div style={{ display: 'grid', gap: 12, color: 'rgba(255,255,255,0.72)', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <UserIcon style={{ width: 18, height: 18, color: '#93c5fd', flexShrink: 0 }} />
                <div>
                  <div style={{ color: 'white', fontWeight: 700 }}>{doctorName}</div>
                  <div>{patientName}</div>
                </div>
              </div>
              <div>{formatAppointmentDate(appointment)}</div>
              <div>Status: {videoSession?.status || appointment?.status || 'Confirmed'}</div>
            </div>
          </section>

          {warning && (
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(245,158,11,0.14)', color: '#fcd34d', fontSize: '0.84rem', lineHeight: 1.5 }}>
              {warning}
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'grid', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={openInNewTab} disabled={!meetingUrl}>
              <ArrowTopRightOnSquareIcon style={{ width: 18, height: 18 }} />
              Open Meeting
            </button>
            <button type="button" className="btn btn-danger" onClick={handleLeave}>
              <PhoneXMarkIcon style={{ width: 18, height: 18 }} />
              {isConnected ? 'End Consultation' : 'Leave Room'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TelemedicineRoom;
