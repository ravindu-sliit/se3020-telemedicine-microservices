/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  DocumentIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import {
  fetchPatientAppointments,
  fetchMyPrescriptions,
  fetchMyMedicalReports
} from '../services/api';

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const formatDateOnly = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const getAppointmentStatusClass = (status) => {
  const normalizedStatus = String(status || '').toLowerCase();
  if (normalizedStatus === 'completed') return 'status-confirmed';
  if (normalizedStatus === 'cancelled') return 'status-inactive';
  return 'status-pending';
};

const MetricCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon style={{ width: 20, height: 20, color }} />
      </div>
    </div>
    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 2 }}>
      {value}
    </div>
    <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 500 }}>{label}</div>
  </div>
);

const MedicalHistory = () => {
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError('');

    try {
      const [appointmentsRes, prescriptionsRes, reportsRes] = await Promise.all([
        fetchPatientAppointments(),
        fetchMyPrescriptions(),
        fetchMyMedicalReports()
      ]);

      setAppointments(Array.isArray(appointmentsRes?.data) ? appointmentsRes.data : []);
      setPrescriptions(Array.isArray(prescriptionsRes?.data) ? prescriptionsRes.data : []);
      setReports(Array.isArray(reportsRes?.data) ? reportsRes.data : []);
    } catch (err) {
      setAppointments([]);
      setPrescriptions([]);
      setReports([]);
      setError(err.message || 'Failed to load medical history.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const completedAppointments = useMemo(
    () => appointments.filter((appt) => String(appt.status || '').toLowerCase() === 'completed'),
    [appointments]
  );

  let content = null;
  if (isLoading) {
    content = <div className="card">Loading medical history...</div>;
  } else if (error) {
    content = (
      <div className="card" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ExclamationTriangleIcon style={{ width: 20, height: 20 }} />
          {error}
        </div>
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Appointment Timeline</h3>
          {appointments.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No appointments found.</div>
          ) : (
            appointments
              .slice()
              .sort((a, b) => new Date(b.appointmentDate || 0).getTime() - new Date(a.appointmentDate || 0).getTime())
              .map((appt) => (
                <div key={appt._id || `${appt.appointmentDate}-${appt.doctorName}`} className="item-row" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                      {appt.doctorName || appt.doctorId || 'Doctor'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                      {formatDateOnly(appt.appointmentDate)} {appt.timeSlot ? `at ${appt.timeSlot}` : ''}
                    </div>
                  </div>
                  <span className={`status ${getAppointmentStatusClass(appt.status)}`}>
                    {appt.status || 'Pending'}
                  </span>
                </div>
              ))
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Uploaded Medical Reports</h3>
          {reports.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
              No reports uploaded yet. Use Patient Profile to upload your reports.
            </div>
          ) : (
            reports.map((report) => (
              <div key={report._id || `${report.fileName}-${report.uploadedAt}`} className="item-row" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{report.reportType || 'Report'}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                    {report.fileName || 'Unnamed file'} • {formatDateTime(report.uploadedAt || report.createdAt)}
                  </div>
                  {report.notes ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginTop: 2 }}>{report.notes}</div>
                  ) : null}
                </div>
                <span className="status status-confirmed">Uploaded</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>Prescription History</h3>
          {prescriptions.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No prescriptions issued yet.</div>
          ) : (
            prescriptions.map((item) => (
              <div key={`${item.doctorId}-${item._id || item.dateIssued}`} className="item-row" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                    {item.doctorName || 'Doctor'}
                    <span style={{ marginLeft: 8, fontWeight: 500, color: 'var(--gray-500)' }}>
                      {item.specialty ? `(${item.specialty})` : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{formatDateOnly(item.dateIssued)}</div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--gray-700)', marginTop: 4 }}>
                    {item.prescriptionText || 'Prescription details unavailable.'}
                  </div>
                </div>
                <span className="status status-confirmed">Issued</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: '32px 0 64px' }}>
        <div className="container">
          <div className="dashboard-header animate-fade-in-up" style={{ marginBottom: 20 }}>
            <h1 className="dashboard-title">Medical History</h1>
            <p className="dashboard-subtitle" style={{ marginBottom: 0 }}>
              Review your full appointment timeline, uploaded reports, and issued prescriptions.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => loadHistory(true)} disabled={refreshing || isLoading}>
              <ArrowPathIcon style={{ width: 14, height: 14 }} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-5" style={{ marginBottom: 24 }}>
            <MetricCard
              icon={CalendarDaysIcon}
              label="All Appointments"
              value={String(appointments.length)}
              color="#2563eb"
              bg="#dbeafe"
            />
            <MetricCard
              icon={ClipboardDocumentListIcon}
              label="Completed Visits"
              value={String(completedAppointments.length)}
              color="#059669"
              bg="#d1fae5"
            />
            <MetricCard
              icon={DocumentIcon}
              label="Uploaded Reports"
              value={String(reports.length)}
              color="#d97706"
              bg="#fef3c7"
            />
            <MetricCard
              icon={ClipboardDocumentListIcon}
              label="Prescriptions"
              value={String(prescriptions.length)}
              color="#7c3aed"
              bg="#ede9fe"
            />
          </div>

          {content}
        </div>
      </div>
    </div>
  );
};

export default MedicalHistory;
