import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  VideoCameraIcon, ComputerDesktopIcon, ChatBubbleLeftRightIcon,
  DocumentTextIcon, PencilSquareIcon, PhoneIcon, ArrowLeftIcon,
  UserIcon, ClockIcon, CheckCircleIcon, SpeakerWaveIcon,
  SpeakerXMarkIcon, PaperAirplaneIcon, DocumentPlusIcon
} from '@heroicons/react/24/outline';

const TelemedicineRoom = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [prescription, setPrescription] = useState({ medication: '', dosage: '', duration: '', instructions: '' });
  const chatEndRef = useRef(null);

  const sessionData = { doctor: 'Dr. Sarah Johnson', patient: 'John Doe', specialty: 'Cardiology', scheduledTime: '10:00 AM', duration: '30 minutes' };

  useEffect(() => {
    const timer = setInterval(() => setSessionTime(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { chatEndRef.current && (chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight); }, [chatMessages]);

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const handleConnect = () => {
    setIsConnected(true);
    setChatMessages([{ id: 1, type: 'system', message: 'Video consultation started', time: new Date().toLocaleTimeString() }]);
  };

  const handleDisconnect = () => { setIsConnected(false); navigate('/patient'); };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages(prev => [...prev, { id: Date.now(), type: 'user', message: newMessage, time: new Date().toLocaleTimeString() }]);
    setNewMessage('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { id: Date.now()+1, type: 'doctor', message: 'Thank you for your message. I understand your concern.', time: new Date().toLocaleTimeString() }]);
    }, 2000);
  };

  const ControlBtn = ({ active, danger, onClick, children }) => (
    <button onClick={onClick} style={{
      width: 48, height: 48, borderRadius: 16, border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: danger ? '#ef4444' : active ? 'var(--primary-600)' : 'rgba(255,255,255,0.1)',
      color: 'white', transition: 'all 0.2s ease', backdropFilter: 'blur(10px)',
    }}>{children}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: 'white', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15,15,26,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/patient')} style={{
            padding: 8, border: 'none', background: 'rgba(255,255,255,0.06)', borderRadius: 10,
            color: 'white', cursor: 'pointer', display: 'flex'
          }}>
            <ArrowLeftIcon style={{ width: 18, height: 18 }} />
          </button>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Video Consultation</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{sessionData.doctor} • {sessionData.patient}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
            <ClockIcon style={{ width: 16, height: 16, opacity: 0.6 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatTime(sessionTime)}</span>
          </div>
          <div style={{
            padding: '4px 14px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
            background: isConnected ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
            color: isConnected ? '#34d399' : '#fbbf24',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isConnected ? '#34d399' : '#fbbf24',
              animation: 'pulse-dot 2s infinite'
            }} />
            {isConnected ? 'Connected' : 'Waiting...'}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        {/* Video Area */}
        <div style={{ flex: 1, position: 'relative', background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)' }}>
          {!isConnected ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 100, height: 100, borderRadius: 28, background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <VideoCameraIcon style={{ width: 44, height: 44, color: 'rgba(255,255,255,0.3)' }} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: 'white' }}>Ready to Start</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 28, fontSize: '0.9rem' }}>
                  Click below to connect with {sessionData.doctor}
                </p>
                <button onClick={handleConnect} style={{
                  padding: '12px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, var(--primary-500), var(--secondary-500))',
                  color: 'white', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex',
                  alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
                  fontFamily: 'var(--font-sans)'
                }}>
                  <VideoCameraIcon style={{ width: 20, height: 20 }} /> Start Video Call
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Doctor Video */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
                  }}>
                    <UserIcon style={{ width: 36, height: 36, color: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: 0 }}>{sessionData.doctor}</p>
                </div>
              </div>
              {/* Self Video */}
              <div style={{
                position: 'absolute', bottom: 80, right: 20, width: 180, height: 130,
                borderRadius: 16, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px'
                  }}>
                    <UserIcon style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: 0 }}>You</p>
                </div>
              </div>
              {/* Controls */}
              <div style={{
                position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 10, padding: '10px 20px', borderRadius: 20,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <ControlBtn active={false} onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <SpeakerXMarkIcon style={{ width: 22, height: 22 }} /> : <SpeakerWaveIcon style={{ width: 22, height: 22 }} />}
                </ControlBtn>
                <ControlBtn active={false} onClick={() => setIsVideoOff(!isVideoOff)}>
                  <VideoCameraIcon style={{ width: 22, height: 22 }} />
                </ControlBtn>
                <ControlBtn active={isScreenSharing} onClick={() => setIsScreenSharing(!isScreenSharing)}>
                  <ComputerDesktopIcon style={{ width: 22, height: 22 }} />
                </ControlBtn>
                <ControlBtn danger onClick={handleDisconnect}>
                  <PhoneIcon style={{ width: 22, height: 22 }} />
                </ControlBtn>
              </div>
            </>
          )}
        </div>

        {/* Side Panel */}
        <div style={{
          width: 360, background: 'rgba(15,15,26,0.95)', borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setShowChat(true)} style={{
              flex: 1, padding: '14px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: showChat ? '#818cf8' : 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)',
              background: showChat ? 'rgba(129,140,248,0.08)' : 'transparent',
              borderBottom: showChat ? '2px solid #818cf8' : '2px solid transparent',
              fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease'
            }}>
              <ChatBubbleLeftRightIcon style={{ width: 18, height: 18 }} /> Chat
            </button>
            <button onClick={() => setShowChat(false)} style={{
              flex: 1, padding: '14px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: !showChat ? '#818cf8' : 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)',
              background: !showChat ? 'rgba(129,140,248,0.08)' : 'transparent',
              borderBottom: !showChat ? '2px solid #818cf8' : '2px solid transparent',
              fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease'
            }}>
              <DocumentTextIcon style={{ width: 18, height: 18 }} /> Tools
            </button>
          </div>

          {/* Chat */}
          {showChat && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div ref={chatEndRef} style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {chatMessages.map(m => (
                  <div key={m.id} style={{ marginBottom: 10, display: 'flex', justifyContent: m.type === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px', borderRadius: m.type === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: m.type === 'user' ? 'var(--primary-600)' : m.type === 'doctor' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                      color: m.type === 'system' ? 'rgba(255,255,255,0.4)' : 'white',
                      fontSize: m.type === 'system' ? '0.75rem' : '0.85rem',
                      textAlign: m.type === 'system' ? 'center' : 'left'
                    }}>
                      <div>{m.message}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: 4 }}>{m.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.85rem',
                    outline: 'none', fontFamily: 'var(--font-sans)'
                  }}
                />
                <button onClick={handleSendMessage} style={{
                  width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'var(--primary-600)', color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <PaperAirplaneIcon style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </div>
          )}

          {/* Tools */}
          {!showChat && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {/* Notes */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Session Notes</span>
                  <button onClick={() => setShowNotes(!showNotes)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#818cf8' }}>
                    <PencilSquareIcon style={{ width: 18, height: 18 }} />
                  </button>
                </div>
                {showNotes && (
                  <div>
                    <textarea value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} placeholder="Add notes..." rows={3}
                      style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                    />
                    <button onClick={() => console.log('Notes saved:', sessionNotes)} style={{
                      marginTop: 8, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'var(--primary-600)', color: 'white', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-sans)'
                    }}>Save Notes</button>
                  </div>
                )}
              </div>

              {/* Prescription */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Prescription</span>
                  <button onClick={() => setShowPrescription(!showPrescription)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#818cf8' }}>
                    <DocumentPlusIcon style={{ width: 18, height: 18 }} />
                  </button>
                </div>
                {showPrescription && (
                  <div>
                    {['medication', 'dosage', 'duration'].map(f => (
                      <input key={f} type="text" value={prescription[f]} onChange={e => setPrescription({...prescription, [f]: e.target.value})}
                        placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                        style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.85rem', marginBottom: 8, fontFamily: 'var(--font-sans)' }}
                      />
                    ))}
                    <textarea value={prescription.instructions} onChange={e => setPrescription({...prescription, instructions: e.target.value})} placeholder="Instructions" rows={2}
                      style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.85rem', resize: 'vertical', marginBottom: 8, fontFamily: 'var(--font-sans)' }}
                    />
                    <button onClick={() => { setShowPrescription(false); setPrescription({ medication: '', dosage: '', duration: '', instructions: '' }); }} style={{
                      padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'var(--primary-600)', color: 'white', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-sans)'
                    }}>Issue Prescription</button>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 10 }}>Quick Actions</span>
                {[
                  { icon: DocumentTextIcon, label: 'View Medical History' },
                  { icon: DocumentPlusIcon, label: 'Upload Documents' },
                  { icon: CheckCircleIcon, label: 'Mark as Completed' },
                ].map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <button key={i} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.03)', color: 'white', cursor: 'pointer',
                      marginBottom: 6, fontSize: '0.85rem', fontFamily: 'var(--font-sans)',
                      textAlign: 'left', transition: 'all 0.2s ease'
                    }}>
                      <Icon style={{ width: 18, height: 18, color: '#818cf8' }} />
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelemedicineRoom;
