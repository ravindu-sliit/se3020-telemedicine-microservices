import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  UserIcon, ClockIcon, CreditCardIcon, CheckCircleIcon,
  ArrowLeftIcon, ArrowRightIcon, StarIcon,
  CurrencyDollarIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { getSession } from '../services/session';
import {
  fetchAllDoctors,
  fetchPatientProfile,
  createAppointment,
  createCheckoutSession
} from '../services/api';

const getDoctorDisplayName = (doctor) => doctor?.userId?.fullName || doctor?.fullName || doctor?.name || 'Doctor';
const getDoctorSpecialty = (doctor) => doctor?.specialty || 'General Medicine';
const getDoctorFee = (doctor) => {
  const fee = Number(doctor?.consultationFee);
  return Number.isFinite(fee) ? fee : 0;
};

const BookAppointment = () => {
  const session = getSession();
  const location = useLocation();
  const suggestedSpecialty = location.state?.specialty || '';
  const suggestedReason = location.state?.reason || '';
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [lastAppointment, setLastAppointment] = useState(null);
  const [patientPhone, setPatientPhone] = useState('');

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState('');

  useEffect(() => {
    const loadDoctors = async () => {
      setDoctorsLoading(true);
      setDoctorsError('');
      try {
        const response = await fetchAllDoctors();
        const records = Array.isArray(response?.data) ? response.data : [];
        setDoctors(records);
      } catch (error) {
        setDoctorsError(error.message || 'Failed to load doctors.');
        setDoctors([]);
      } finally {
        setDoctorsLoading(false);
      }
    };
    loadDoctors();
  }, []);

  useEffect(() => {
    const loadPatientPhone = async () => {
      const userId = session?.user?._id || session?.user?.id;
      if (!userId) return;

      try {
        const response = await fetchPatientProfile(userId);
        const profilePhone = response?.data?.phone || '';
        if (profilePhone) {
          setPatientPhone(profilePhone);
        }
      } catch (_error) {
        setPatientPhone('');
      }
    };

    loadPatientPhone();
  }, [session?.user?._id, session?.user?.id]);

  // Generate next 7 days dynamically
  const availableDates = useMemo(() => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }, []);

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !selectedDoctor) return [];
    
    // Calculate the day of the week for the selected date
    const dateObj = new Date(selectedDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[dateObj.getDay()];

    const doctorAvail = selectedDoctor.availability || [];
    const dayAvail = doctorAvail.filter(a => a.dayOfWeek === dayOfWeek);

    const baseSlots = [
      '08:00 AM','08:30 AM','09:00 AM','09:30 AM','10:00 AM','10:30 AM',
      '11:00 AM','11:30 AM','12:00 PM','12:30 PM','01:00 PM','01:30 PM',
      '02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM',
      '05:00 PM','05:30 PM','06:00 PM','06:30 PM','07:00 PM','07:30 PM'
    ];

    //if (dayAvail.length === 0) return baseSlots;

    const timeToNumber = (tStr) => {
       if (!tStr || typeof tStr !== 'string') return null;

       const value = tStr.trim().toUpperCase();
       const twelveHourMatch = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
       if (twelveHourMatch) {
         let hours = Number(twelveHourMatch[1]);
         const minutes = Number(twelveHourMatch[2]);
         const period = twelveHourMatch[3];

         if (period === 'PM' && hours !== 12) hours += 12;
         if (period === 'AM' && hours === 12) hours = 0;

         return hours + (minutes / 60);
       }

       const twentyFourHourMatch = value.match(/^(\d{1,2}):(\d{2})$/);
       if (twentyFourHourMatch) {
         const hours = Number(twentyFourHourMatch[1]);
         const minutes = Number(twentyFourHourMatch[2]);
         if (hours > 23 || minutes > 59) return null;
         return hours + (minutes / 60);
       }

       return null;
    };

    return baseSlots.filter(slot => {
       const slotValue = timeToNumber(slot);
       return dayAvail.some(block => {
          const start = timeToNumber(block.startTime);
          const end = timeToNumber(block.endTime);
         if (start === null || end === null) return false;
          return slotValue >= start && slotValue <= end;
       });
    });

  }, [selectedDate, selectedDoctor]);

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCardIcon },
    { id: 'paypal', name: 'PayPal', icon: ShieldCheckIcon },
    { id: 'payhere', name: 'PayHere', icon: CurrencyDollarIcon }
  ];

  const steps = [
    { num: 1, label: 'Select Doctor' },
    { num: 2, label: 'Date & Time' },
    { num: 3, label: 'Payment' },
    { num: 4, label: 'Confirmation' }
  ];

  const handleCompleteBooking = async () => {
    if (!selectedDoctor) return;

    setBookingInProgress(true);
    setBookingError('');

    try {
      const appointmentResponse = await createAppointment({
        doctorId: selectedDoctor.userId?._id || selectedDoctor.userId || selectedDoctor._id,
        doctorName: getDoctorDisplayName(selectedDoctor),
        patientName: session?.user?.fullName || 'Patient',
        appointmentDate: selectedDate,
        timeSlot: selectedTime,
        reason: 'Consultation'
      });

      const appointmentId = appointmentResponse?.data?._id || appointmentResponse?.data?.id;
      const totalAmount = getDoctorFee(selectedDoctor) + 5;

      let checkoutUrl = '';
      if (appointmentId) {
        const paymentResponse = await createCheckoutSession({
          appointmentId,
          amount: totalAmount,
          currency: 'usd',
          patientEmail: session?.user?.email || '',
          patientPhone: patientPhone?.trim() || ''
        });
        checkoutUrl = paymentResponse?.checkoutUrl || '';
      }

      setLastAppointment({
        id: appointmentId,
        checkoutUrl
      });

      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }

      setCurrentStep(4);
    } catch (error) {
      setBookingError(error.message || 'Failed to complete booking workflow.');
    } finally {
      setBookingInProgress(false);
    }
  };

  const filteredDoctors = useMemo(() => {
    if (!suggestedSpecialty) return doctors;

    const normalizedSuggested = suggestedSpecialty.trim().toLowerCase();
    const filtered = doctors.filter((doctor) => {
      const specialty = (doctor.specialty || '').toLowerCase();
      const name = getDoctorDisplayName(doctor).toLowerCase();
      return specialty.includes(normalizedSuggested) || normalizedSuggested.includes(specialty) || name.includes(normalizedSuggested);
    });

    return filtered.length > 0 ? filtered : doctors;
  }, [suggestedSpecialty, doctors]);

  const StepIndicator = () => (
    <div className="step-indicator">
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className="step-item">
            <div className={`step-circle ${currentStep === s.num ? 'active' : currentStep > s.num ? 'completed' : 'inactive'}`}>
              {currentStep > s.num ? '✓' : s.num}
            </div>
            <span className={`step-label ${currentStep === s.num ? 'active' : 'inactive'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`step-connector ${currentStep > s.num ? 'completed' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input type="text" placeholder="Search by specialty or doctor name..." className="form-input" style={{ flex: 1 }} />
        <button className="btn btn-primary">Search</button>
      </div>
      {suggestedSpecialty && (
        <div className="card" style={{ marginBottom: 20, padding: 16, border: '1px solid #ddd6fe', background: '#f5f3ff' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary-600)', fontWeight: 700, marginBottom: 6 }}>
            AI Recommendation
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 6, color: 'var(--gray-900)' }}>{suggestedSpecialty}</div>
          {suggestedReason && <p style={{ marginBottom: 0, color: 'var(--gray-600)', lineHeight: 1.6 }}>{suggestedReason}</p>}
        </div>
      )}
      {doctorsLoading ? (
        <div className="loading-state">Loading available doctors...</div>
      ) : doctorsError ? (
        <div className="error-state">{doctorsError}</div>
      ) : filteredDoctors.length === 0 ? (
        <div style={{ color: 'var(--gray-500)', padding: '20px 0' }}>No doctors available at this time.</div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {filteredDoctors.map((doc, idx) => (
            <div key={doc._id || doc.id || idx} className="card" style={{ cursor: 'pointer', padding: 24 }}
              onClick={() => { setSelectedDoctor(doc); setCurrentStep(2); }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserIcon style={{ width: 28, height: 28, color: 'var(--primary-500)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4, color: 'var(--gray-900)' }}>
                    {getDoctorDisplayName(doc)}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 8 }}>{getDoctorSpecialty(doc)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, fontSize: '0.8rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <StarIcon style={{ width: 14, height: 14, color: '#f59e0b' }} /> {doc.rating || '4.5'}
                    </span>
                    <span style={{ color: 'var(--gray-400)' }}>•</span>
                    <span style={{ color: 'var(--gray-500)' }}>{doc.yearsOfExperience ? `${doc.yearsOfExperience} yrs` : 'Experienced'}</span>
                    <span style={{ color: 'var(--gray-400)' }}>•</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>${getDoctorFee(doc)}</span>
                  </div>
                  {Array.isArray(doc.qualifications) && doc.qualifications.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>
                      {doc.qualifications.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
                <button className="btn btn-primary w-full">Select Doctor</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserIcon style={{ width: 22, height: 22, color: 'var(--primary-500)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)' }}>
              {getDoctorDisplayName(selectedDoctor)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
              {getDoctorSpecialty(selectedDoctor)} • ${getDoctorFee(selectedDoctor)}
            </div>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Available Dates</h3>
        <div className="grid grid-cols-7 gap-2">
          {availableDates.map(date => (
            <button key={date} onClick={() => setSelectedDate(date)} style={{
              padding: '10px 8px', borderRadius: 12, border: selectedDate === date ? '2px solid var(--primary-500)' : '2px solid var(--gray-100)',
              background: selectedDate === date ? 'var(--primary-50)' : 'white', cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.2s ease', fontFamily: 'inherit'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: selectedDate === date ? 'var(--primary-700)' : 'var(--gray-500)' }}>
                {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: selectedDate === date ? 'var(--primary-700)' : 'var(--gray-800)' }}>
                {new Date(date).getDate()}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Time Slots</h3>
        {availableTimeSlots.length === 0 ? (
          <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0', background: 'var(--gray-50)', borderRadius: 12 }}>
            No available time slots on this date according to the doctor's schedule. Please select a different date.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {availableTimeSlots.map(time => (
              <button key={time} onClick={() => setSelectedTime(time)} style={{
                padding: '10px', borderRadius: 12, border: selectedTime === time ? '2px solid var(--primary-500)' : '2px solid var(--gray-100)',
                background: selectedTime === time ? 'var(--primary-50)' : 'white', cursor: 'pointer',
                textAlign: 'center', transition: 'all 0.2s ease', fontFamily: 'inherit'
              }}>
                <ClockIcon style={{ width: 16, height: 16, margin: '0 auto 4px', color: selectedTime === time ? 'var(--primary-600)' : 'var(--gray-400)' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: selectedTime === time ? 'var(--primary-700)' : 'var(--gray-600)' }}>{time}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
        <button onClick={() => setCurrentStep(1)} className="btn btn-secondary"><ArrowLeftIcon style={{ width: 16, height: 16 }} /> Back</button>
        <button onClick={() => selectedDate && selectedTime && setCurrentStep(3)} disabled={!selectedDate || !selectedTime} className="btn btn-primary">Continue <ArrowRightIcon style={{ width: 16, height: 16 }} /></button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Appointment Summary</h3>
          <div className="space-y-3">
            {[
              ['Doctor', getDoctorDisplayName(selectedDoctor)], ['Specialty', getDoctorSpecialty(selectedDoctor)],
              ['Date', selectedDate], ['Time', selectedTime],
              ['Fee', '$' + getDoctorFee(selectedDoctor)], ['Service Charge', '$5']
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>{l}</span>
                <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 800, color: 'var(--primary-600)', fontSize: '1.1rem' }}>${getDoctorFee(selectedDoctor) + 5}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Payment Method</h3>
          <div className="space-y-3">
            {paymentMethods.map(m => {
              const Icon = m.icon;
              return (
                <label key={m.id} style={{
                  display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: 14,
                  border: '2px solid var(--gray-100)', cursor: 'pointer', transition: 'all 0.2s ease', gap: 12
                }}>
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={selectedPaymentMethod === m.id}
                    onChange={(event) => setSelectedPaymentMethod(event.target.value)}
                    style={{ accentColor: 'var(--primary-600)' }}
                  />
                  <Icon style={{ width: 22, height: 22, color: 'var(--primary-600)' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.name}</span>
                </label>
              );
            })}
          </div>
          {bookingError && (
            <div style={{ marginTop: 14, color: '#b91c1c', fontSize: '0.85rem' }}>
              {bookingError}
            </div>
          )}
          <div style={{ marginTop: 20 }}>
            <div className="form-group">
              <label className="form-label">Phone Number for SMS Updates</label>
              <input
                type="tel"
                placeholder="e.g. +94718582821"
                className="form-input"
                value={patientPhone}
                onChange={(event) => setPatientPhone(event.target.value)}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 6 }}>
                You can change this number here for this checkout.
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', background: 'var(--gray-50)', borderRadius: 10, padding: 10 }}>
              Card details will be entered securely on the Stripe checkout page.
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
        <button onClick={() => setCurrentStep(2)} className="btn btn-secondary"><ArrowLeftIcon style={{ width: 16, height: 16 }} /> Back</button>
        <button
          onClick={handleCompleteBooking}
          disabled={bookingInProgress || !selectedDoctor || !(selectedDoctor.userId?._id || selectedDoctor.userId || selectedDoctor._id)}
          className="btn btn-primary"
        >
          {bookingInProgress ? 'Processing...' : 'Complete Payment'} <ArrowRightIcon style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div className="animate-scale-in" style={{
          width: 72, height: 72, borderRadius: '50%', background: 'var(--success-50)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
        }}>
          <CheckCircleIcon style={{ width: 36, height: 36, color: 'var(--success-600)' }} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>Appointment Created</h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: 32, fontSize: '0.95rem' }}>Your appointment request is saved. Complete payment to confirm it.</p>
        <div style={{ background: 'var(--gray-50)', borderRadius: 16, padding: 24, marginBottom: 28, textAlign: 'left' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Doctor', getDoctorDisplayName(selectedDoctor)], ['Specialty', getDoctorSpecialty(selectedDoctor)],
              ['Date', selectedDate], ['Time', selectedTime],
              ['Fee', '$' + getDoctorFee(selectedDoctor)],
              ['Payment Method', selectedPaymentMethod],
              ['Confirmation', lastAppointment?.id || ('APT-' + Math.random().toString(36).substr(2, 9).toUpperCase())]
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-800)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        {lastAppointment?.checkoutUrl && (
          <div style={{ marginBottom: 20 }}>
            <a href={lastAppointment.checkoutUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
              Continue to Payment
            </a>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 20 }}>
          <Link to="/patient" className="btn btn-secondary">Go to Dashboard</Link>
          <Link to="/home" className="btn btn-primary">View Appointment Status</Link>
        </div>
        <div style={{ background: 'var(--warning-50)', border: '1px solid var(--warning-200)', borderRadius: 12, padding: 14 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--warning-800)', marginBottom: 0 }}>
            <strong>Important:</strong> Join the video call 5 minutes before your scheduled time.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: '32px 0 60px' }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 12, color: 'var(--gray-900)' }}>
            {currentStep === 4 ? '' : 'Book Appointment'}
          </h1>
          {currentStep < 4 && <StepIndicator />}
          <div className="animate-fade-in-up">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
