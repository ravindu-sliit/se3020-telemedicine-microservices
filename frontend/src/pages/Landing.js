import React from 'react';
import { Link } from 'react-router-dom';
import { FaVideo, FaRobot, FaFileMedical, FaHeartbeat, FaShieldAlt, FaUserMd, FaCalendarCheck } from 'react-icons/fa';
import { 
  PlayCircleIcon, 
  UserGroupIcon, 
  CalendarDaysIcon, 
  VideoCameraIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';

const Landing = () => {
  const features = [
    { icon: VideoCameraIcon, color: '#4f46e5', bg: '#eef2ff', title: 'Video Consultations', desc: 'Crystal-clear HD video calls with certified healthcare professionals, anytime, anywhere.' },
    { icon: FaRobot, color: '#0ea5e9', bg: '#f0f9ff', title: 'AI Symptom Checker', desc: 'Get instant preliminary health assessments powered by advanced AI technology.' },
    { icon: CalendarDaysIcon, color: '#10b981', bg: '#ecfdf5', title: 'Easy Booking', desc: 'Schedule appointments in seconds with our streamlined booking system.' },
    { icon: FaFileMedical, color: '#f59e0b', bg: '#fffbeb', title: 'Digital Prescriptions', desc: 'Receive, manage, and refill your prescriptions entirely online.' },
  ];

  const steps = [
    { icon: PlayCircleIcon, num: '01', title: 'Get Started', desc: 'Create your account and access the platform instantly' },
    { icon: UserGroupIcon, num: '02', title: 'Choose Portal', desc: 'Select Patient, Doctor, or Admin portal' },
    { icon: CalendarDaysIcon, num: '03', title: 'Book Session', desc: 'Find a doctor and schedule your appointment' },
    { icon: FaVideo, num: '04', title: 'Consult', desc: 'Join your video call and receive care' },
  ];

  const stats = [
    { value: '10K+', label: 'Active Patients' },
    { value: '500+', label: 'Verified Doctors' },
    { value: '50K+', label: 'Consultations' },
    { value: '98%', label: 'Satisfaction' },
  ];

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-gradient" style={{ padding: '80px 0 100px', position: 'relative' }}>
        {/* Decorative orbs */}
        <div className="glass-orb" style={{ width: 300, height: 300, top: -50, right: -50 }} />
        <div className="glass-orb" style={{ width: 200, height: 200, bottom: -30, left: '10%', animationDelay: '2s' }} />
        <div className="glass-orb" style={{ width: 150, height: 150, top: '20%', left: '60%', animationDelay: '4s' }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <div className="animate-fade-in-up" style={{ marginBottom: 24 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                padding: '8px 20px', borderRadius: 999, color: 'white',
                fontSize: '0.875rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <FaShieldAlt /> Trusted by 10,000+ patients worldwide
              </span>
            </div>
            <h1 className="animate-fade-in-up delay-100" style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', fontWeight: 900,
              color: 'white', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.03em'
            }}>
              Healthcare at Your<br />
              <span style={{ opacity: 0.9 }}>Fingertips</span>
            </h1>
            <p className="animate-fade-in-up delay-200" style={{
              fontSize: '1.125rem', color: 'rgba(255,255,255,0.85)',
              maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7
            }}>
              Connect with certified medical professionals from the comfort of your home. 
              Secure, convenient, and always available.
            </p>
            <div className="animate-fade-in-up delay-300" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-lg" style={{
                background: 'white', color: '#4f46e5', fontWeight: 700,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)', borderRadius: 16, padding: '14px 32px'
              }}>
                Sign In to Continue <ArrowRightIcon style={{ width: 20, height: 20 }} />
              </Link>
              <Link to="/register" className="btn btn-lg" style={{
                background: 'rgba(255,255,255,0.15)', color: 'white',
                border: '2px solid rgba(255,255,255,0.3)', borderRadius: 16,
                backdropFilter: 'blur(10px)', padding: '14px 32px'
              }}>
                Create Patient Account
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="animate-fade-in-up delay-400" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
            marginTop: 80, padding: '28px 40px', borderRadius: 20,
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>{s.value}</div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{
              display: 'inline-block', background: 'var(--primary-50)', color: 'var(--primary-600)',
              padding: '6px 16px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16
            }}>Features</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 12, letterSpacing: '-0.025em' }}>
              Everything you need for<br />modern healthcare
            </h2>
            <p style={{ color: 'var(--gray-500)', maxWidth: 500, margin: '0 auto' }}>
              Our platform brings together cutting-edge technology and healthcare expertise.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="card animate-fade-in-up" style={{
                  textAlign: 'center', padding: 32, cursor: 'default', animationDelay: `${i * 0.1}s`,
                  border: '1px solid var(--gray-100)'
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 16, background: feat.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <Icon style={{ width: 28, height: 28, color: feat.color }} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, color: 'var(--gray-900)' }}>{feat.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: 0 }}>{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '100px 0', background: 'white' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{
              display: 'inline-block', background: 'var(--success-50)', color: 'var(--success-600)',
              padding: '6px 16px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16
            }}>How It Works</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
              Get started in minutes
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="animate-fade-in-up" style={{
                  textAlign: 'center', position: 'relative', animationDelay: `${i * 0.15}s`
                }}>
                  <div style={{
                    fontSize: '3rem', fontWeight: 900, color: 'var(--gray-100)',
                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                    lineHeight: 1, zIndex: 0
                  }}>{step.num}</div>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '20px auto 16px', position: 'relative', zIndex: 1,
                    boxShadow: '0 8px 24px rgba(79,70,229,0.25)'
                  }}>
                    <Icon style={{ width: 24, height: 24, color: 'white' }} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 0 }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(135deg, var(--gray-900) 0%, #1e293b 100%)'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: 16, letterSpacing: '-0.025em' }}>
            Ready to transform your healthcare experience?
          </h2>
          <p style={{ color: 'var(--gray-400)', marginBottom: 32, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Join thousands of patients who trust MediConnect for their telehealth needs.
          </p>
          <Link to="/home" className="btn btn-primary btn-lg">
            Start Your Journey <ArrowRightIcon style={{ width: 20, height: 20 }} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 0', borderTop: '1px solid var(--gray-200)', background: 'white' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaHeartbeat style={{ color: 'var(--primary-500)' }} />
            <span style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.9rem' }}>MediConnect</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>© 2026 MediConnect. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
