import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon, ArrowRightIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { checkSymptoms } from '../services/api';

const symptomExamples = [
  'Fever, cough, sore throat',
  'Skin rash and itching',
  'Headache, dizziness, nausea',
  'Chest pain and shortness of breath'
];

const SymptomChecker = () => {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const canSubmit = useMemo(() => symptoms.trim().length > 2 && !isSubmitting, [symptoms, isSubmitting]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setIsSubmitting(true);

    try {
      const response = await checkSymptoms(symptoms.trim());
      setResult(response);
    } catch (submitError) {
      setError(submitError.message || 'Unable to analyze symptoms right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookAppointment = () => {
    if (!result?.recommendedSpecialty) return;

    navigate('/patient/book-appointment', {
      state: {
        specialty: result.recommendedSpecialty,
        reason: result.preliminarySuggestion
      }
    });
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: '40px 0 72px' }}>
        <div className="container" style={{ maxWidth: 980 }}>
          <div className="card" style={{ padding: 32, marginBottom: 24, border: '1px solid var(--gray-100)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SparklesIcon style={{ width: 24, height: 24, color: 'var(--primary-600)' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 4, color: 'var(--gray-900)' }}>AI Symptom Checker</h1>
                <p style={{ marginBottom: 0, color: 'var(--gray-500)' }}>Describe your symptoms and get a preliminary suggestion plus a recommended specialty.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
              <form onSubmit={handleSubmit} className="card" style={{ padding: 24, border: '1px solid var(--gray-100)' }}>
                <div className="form-group">
                  <label className="form-label">Symptoms</label>
                  <textarea
                    className="form-input"
                    rows="7"
                    placeholder="Example: fever, cough, sore throat, fatigue"
                    value={symptoms}
                    onChange={(event) => setSymptoms(event.target.value)}
                    style={{ resize: 'vertical', minHeight: 180 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                  {symptomExamples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setSymptoms(example)}
                      style={{
                        border: '1px solid var(--gray-200)',
                        background: 'white',
                        borderRadius: 999,
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--gray-600)'
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>

                {error && (
                  <div style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    padding: 14,
                    borderRadius: 14,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    marginBottom: 18
                  }}>
                    <ExclamationTriangleIcon style={{ width: 20, height: 20, color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ marginBottom: 0, color: '#991b1b', fontSize: '0.9rem' }}>{error}</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Symptoms
                        <ArrowRightIcon style={{ width: 18, height: 18 }} />
                      </>
                    )}
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                    This provides a preliminary suggestion only.
                  </span>
                </div>
              </form>

              <div className="card" style={{ padding: 24, border: '1px solid var(--gray-100)' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 16, color: 'var(--gray-900)' }}>Result</h2>
                {result ? (
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div style={{ padding: 16, borderRadius: 14, background: 'var(--gray-50)', border: '1px solid var(--gray-100)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-400)', fontWeight: 700, marginBottom: 6 }}>
                        Preliminary Suggestion
                      </div>
                      <p style={{ marginBottom: 0, color: 'var(--gray-700)', lineHeight: 1.65 }}>{result.preliminarySuggestion}</p>
                    </div>

                    <div style={{ padding: 16, borderRadius: 14, background: 'var(--primary-50)', border: '1px solid #ddd6fe' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary-600)', fontWeight: 700, marginBottom: 6 }}>
                        Recommended Specialty
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gray-900)' }}>{result.recommendedSpecialty}</div>
                    </div>

                    <button onClick={handleBookAppointment} className="btn btn-secondary">
                      Book {result.recommendedSpecialty} Appointment
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: 18, borderRadius: 14, background: 'var(--gray-50)', color: 'var(--gray-500)', lineHeight: 1.65 }}>
                    Your AI result will appear here after you submit symptoms.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;
