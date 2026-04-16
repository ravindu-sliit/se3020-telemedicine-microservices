import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon, UserGroupIcon, DocumentTextIcon, CogIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { fetchPatientAppointments } from '../services/api';
import { getSession } from '../services/session';

const parseAppointmentDateTime = (appointment) => {
  if (!appointment?.appointmentDate) {
    return null;
  }

  const date = new Date(appointment.appointmentDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const value = String(appointment.timeSlot || '').trim().toUpperCase();
  if (!value) {
    return date;
  }

  const twelveHourMatch = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (twelveHourMatch) {
    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const period = twelveHourMatch[3];

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  const twentyFourHourMatch = value.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);
    if (hours <= 23 && minutes <= 59) {
      date.setHours(hours, minutes, 0, 0);
    }
    return date;
  }

  return date;
};

const sortByDateAsc = (a, b) => {
  const first = parseAppointmentDateTime(a)?.getTime() || 0;
  const second = parseAppointmentDateTime(b)?.getTime() || 0;
  return first - second;
};

const sortByDateDesc = (a, b) => sortByDateAsc(b, a);

const getStatusClass = (status) => {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'confirmed' || normalized === 'completed') {
    return 'status-confirmed';
  }

  if (normalized === 'pending') {
    return 'status-pending';
  }

  return 'status-inactive';
};

const Home = () => {
  const session = getSession();
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');

  const features = [
    { title: 'Book Appointment', description: 'Schedule consultations with healthcare professionals', icon: CalendarIcon, path: '/patient/book-appointment' },
    { title: 'AI Symptom Checker', description: 'Get preliminary health assessments instantly', icon: CogIcon, path: '/patient/symptom-checker' },
    { title: 'Medical Records', description: 'View and manage your health profile', icon: DocumentTextIcon, path: '/patient/profile' },
    { title: 'Find Doctors', description: 'Search and filter doctors by specialty', icon: UserGroupIcon, path: '/patient/book-appointment' },
  ];

  useEffect(() => {
    const loadAppointments = async () => {
      if (!session?.token || session?.user?.role !== 'patient') {
        setAppointments([]);
        setAppointmentsLoading(false);
        return;
      }

      try {
        setAppointmentsLoading(true);
        setAppointmentsError('');
        const response = await fetchPatientAppointments();
        setAppointments(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        setAppointments([]);
        setAppointmentsError(error.message || 'Failed to load appointments.');
      } finally {
        setAppointmentsLoading(false);
      }
    };

    loadAppointments();
  }, [session?.token, session?.user?.role]);

  const categorizedAppointments = useMemo(() => {
    const upcoming = [];
    const ongoing = [];
    const ended = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    appointments.forEach((appointment) => {
      const status = String(appointment.status || '').toLowerCase();
      const appointmentDate = parseAppointmentDateTime(appointment);
      const appointmentDay = appointmentDate
        ? new Date(
            appointmentDate.getFullYear(),
            appointmentDate.getMonth(),
            appointmentDate.getDate()
          )
        : null;

      const isToday = appointmentDay && appointmentDay.getTime() === todayStart.getTime();
      const isPast = appointmentDate ? appointmentDate.getTime() < now.getTime() : false;

      if (status === 'completed' || status === 'cancelled') {
        ended.push(appointment);
        return;
      }

      if (status === 'confirmed' && (isToday || isPast)) {
        ongoing.push(appointment);
        return;
      }

      if (status === 'pending' || status === 'confirmed') {
        if (isPast) {
          ended.push(appointment);
        } else {
          upcoming.push(appointment);
        }
        return;
      }

      ended.push(appointment);
    });

    return {
      upcoming: [...upcoming].sort(sortByDateAsc),
      ongoing: [...ongoing].sort(sortByDateAsc),
      ended: [...ended].sort(sortByDateDesc)
    };
  }, [appointments]);

  const formatDate = (appointment) => {
    const appointmentDate = parseAppointmentDateTime(appointment);
    if (!appointmentDate) {
      return 'Date not available';
    }

    return appointmentDate.toLocaleString();
  };

  const handleJoinMeeting = (appointment) => {
    if (appointment?.videoMeetingUrl) {
      window.open(appointment.videoMeetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const renderAppointmentList = (items, section) => {
    if (appointmentsLoading) {
      return <div className="loading-state">Loading appointments...</div>;
    }

    if (appointmentsError) {
      return <div className="error-state">{appointmentsError}</div>;
    }

    if (!session?.token || session?.user?.role !== 'patient') {
      return <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Sign in as a patient to view appointment details.</div>;
    }

    if (items.length === 0) {
      return <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No appointments in this section.</div>;
    }

    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((appointment, index) => {
          const doctorName = appointment.doctorName || appointment.doctorId || 'Doctor';
          const canJoin = section !== 'ended' && Boolean(appointment.videoMeetingUrl);

          return (
            <div key={appointment._id || index} className="item-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--gray-900)' }}>{doctorName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{formatDate(appointment)}</div>
                </div>
                <span className={`status ${getStatusClass(appointment.status)}`}>{appointment.status || 'Unknown'}</span>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: 10 }}>
                Reason: {appointment.reason || 'Consultation'}
              </div>

              {section !== 'ended' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleJoinMeeting(appointment)}
                  disabled={!canJoin}
                  style={{ alignSelf: 'flex-end' }}
                >
                  <VideoCameraIcon style={{ width: 16, height: 16 }} />
                  {canJoin ? 'Join Live Meeting' : 'Join (Available After Confirmation)'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: '40px 0 80px' }}>
        <div className="container">
          {/* Welcome Header */}
          <div className="animate-fade-in-up" style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
            borderRadius: 24, padding: '40px 48px', marginBottom: 40,
            position: 'relative', overflow: 'hidden'
          }}>
            <div className="glass-orb" style={{ width: 200, height: 200, top: -60, right: -40, opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: 8, letterSpacing: '-0.03em' }}>
                Welcome to MediConnect
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 24, fontSize: '1rem' }}>
                Your all-in-one platform for modern telehealth
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 20 }}>Quick Actions</h2>
            <div className="grid grid-cols-4 gap-5">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link key={index} to={feature.path} style={{ textDecoration: 'none' }}>
                    <div className="card animate-fade-in-up" style={{
                      textAlign: 'center', padding: 24, cursor: 'pointer',
                      animationDelay: `${index * 0.08}s`
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: 'var(--primary-50)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px'
                      }}>
                        <Icon style={{ width: 22, height: 22, color: 'var(--primary-600)' }} />
                      </div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4, color: 'var(--gray-900)' }}>{feature.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 0, lineHeight: 1.5 }}>{feature.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Appointment Overview */}
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 20 }}>My Appointments</h2>
            <div className="grid grid-cols-3 gap-5">
              <div className="card">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Upcoming</h3>
                {renderAppointmentList(categorizedAppointments.upcoming, 'upcoming')}
              </div>
              <div className="card">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Ongoing</h3>
                {renderAppointmentList(categorizedAppointments.ongoing, 'ongoing')}
              </div>
              <div className="card">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Ended</h3>
                {renderAppointmentList(categorizedAppointments.ended, 'ended')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
