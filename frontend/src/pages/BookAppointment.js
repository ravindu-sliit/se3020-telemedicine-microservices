import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  UserIcon, ClockIcon, CreditCardIcon, CheckCircleIcon,
  ArrowLeftIcon, ArrowRightIcon, StarIcon,
  CurrencyDollarIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';

const BookAppointment = () => {
  const location = useLocation();
  const suggestedSpecialty = location.state?.specialty || '';
  const suggestedReason = location.state?.reason || '';
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const doctors = [
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiology', rating: 4.8, experience: '15 years', consultationFee: 150, availability: ['Mon','Tue','Wed','Thu','Fri'], education: 'Harvard Medical School', languages: ['English','Spanish'] },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Dermatology', rating: 4.9, experience: '12 years', consultationFee: 120, availability: ['Mon','Tue','Thu','Fri'], education: 'Johns Hopkins University', languages: ['English','Mandarin'] },
    { id: 3, name: 'Dr. Emily Brown', specialty: 'Pediatrics', rating: 4.7, experience: '10 years', consultationFee: 100, availability: ['Mon','Wed','Thu','Fri'], education: 'Stanford Medical School', languages: ['English','French'] },
    { id: 4, name: 'Dr. James Wilson', specialty: 'Orthopedics', rating: 4.6, experience: '18 years', consultationFee: 180, availability: ['Tue','Wed','Thu','Fri'], education: 'Mayo Clinic School of Medicine', languages: ['English'] }
  ];

  const availableDates = ['2024-03-29','2024-03-30','2024-03-31','2024-04-01','2024-04-02','2024-04-03','2024-04-04'];
  const timeSlots = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'];
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

  const filteredDoctors = useMemo(() => {
    if (!suggestedSpecialty) {
      return doctors;
    }

    return doctors.filter((doctor) => doctor.specialty.toLowerCase() === suggestedSpecialty.toLowerCase());
  }, [suggestedSpecialty]);

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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {['All','Cardiology','Dermatology','Pediatrics','Orthopedics'].map((s, i) => (
          <span key={s} style={{
            padding: '6px 16px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            background: i === 0 ? 'var(--primary-600)' : 'var(--gray-100)',
            color: i === 0 ? 'white' : 'var(--gray-600)',
            transition: 'all 0.2s ease'
          }}>{s}</span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5">
        {filteredDoctors.map(doc => (
          <div key={doc.id} className="card" style={{ cursor: 'pointer', padding: 24 }} onClick={() => { setSelectedDoctor(doc); setCurrentStep(2); }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <UserIcon style={{ width: 28, height: 28, color: 'var(--primary-500)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4, color: 'var(--gray-900)' }}>{doc.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 8 }}>{doc.specialty}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, fontSize: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <StarIcon style={{ width: 14, height: 14, color: '#f59e0b' }} /> {doc.rating}
                  </span>
                  <span style={{ color: 'var(--gray-400)' }}>•</span>
                  <span style={{ color: 'var(--gray-500)' }}>{doc.experience}</span>
                  <span style={{ color: 'var(--gray-400)' }}>•</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>${doc.consultationFee}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 8 }}>
                  {doc.education} • {doc.languages.join(', ')}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {doc.availability.map(d => (
                    <span key={d} style={{ fontSize: '0.7rem', background: 'var(--success-50)', color: 'var(--success-700)', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{d}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
              <button className="btn btn-primary w-full">Select Doctor</button>
            </div>
          </div>
        ))}
      </div>
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
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)' }}>{selectedDoctor.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{selectedDoctor.specialty} • ${selectedDoctor.consultationFee}</div>
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
        <div className="grid grid-cols-4 gap-3">
          {timeSlots.map(time => (
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
              ['Doctor', selectedDoctor.name], ['Specialty', selectedDoctor.specialty],
              ['Date', selectedDate], ['Time', selectedTime],
              ['Fee', '$' + selectedDoctor.consultationFee], ['Service Charge', '$5']
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>{l}</span>
                <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 800, color: 'var(--primary-600)', fontSize: '1.1rem' }}>${selectedDoctor.consultationFee + 5}</span>
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
                  <input type="radio" name="payment" value={m.id} style={{ accentColor: 'var(--primary-600)' }} />
                  <Icon style={{ width: 22, height: 22, color: 'var(--primary-600)' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.name}</span>
                </label>
              );
            })}
          </div>
          <div style={{ marginTop: 20 }}>
            <div className="form-group"><label className="form-label">Card Number</label><input type="text" placeholder="1234 5678 9012 3456" className="form-input" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="form-label">Expiry</label><input type="text" placeholder="MM/YY" className="form-input" /></div>
              <div className="form-group"><label className="form-label">CVV</label><input type="text" placeholder="123" className="form-input" /></div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
        <button onClick={() => setCurrentStep(2)} className="btn btn-secondary"><ArrowLeftIcon style={{ width: 16, height: 16 }} /> Back</button>
        <button onClick={() => setCurrentStep(4)} className="btn btn-primary">Complete Payment <ArrowRightIcon style={{ width: 16, height: 16 }} /></button>
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
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>Appointment Confirmed!</h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: 32, fontSize: '0.95rem' }}>Your appointment has been successfully booked.</p>
        <div style={{ background: 'var(--gray-50)', borderRadius: 16, padding: 24, marginBottom: 28, textAlign: 'left' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Doctor', selectedDoctor.name], ['Specialty', selectedDoctor.specialty],
              ['Date', selectedDate], ['Time', selectedTime],
              ['Fee', '$' + selectedDoctor.consultationFee],
              ['Confirmation', 'APT-' + Math.random().toString(36).substr(2, 9).toUpperCase()]
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-800)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 20 }}>
          <Link to="/patient" className="btn btn-secondary">Go to Dashboard</Link>
          <Link to="/telemedicine-room" className="btn btn-primary">Join Video Call</Link>
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
