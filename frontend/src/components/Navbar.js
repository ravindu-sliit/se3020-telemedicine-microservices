import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHeartbeat } from 'react-icons/fa';
import { clearSession, getSession } from '../services/session';

const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;
  const session = getSession();
  const isLoggedIn = Boolean(session?.token);

  const links = [
    { to: '/home', label: 'Home' },
    { to: '/patient/book-appointment', label: 'Appointment' },
    { to: '/patient/symptom-checker', label: 'Symptom Checker' },
    { to: '/patient/profile', label: 'Profile' },
  ];

  const handleLogout = () => {
    clearSession();
    window.location.href = '/login';
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <FaHeartbeat style={{ color: 'white', fontSize: '18px' }} />
          </div>
          <span className="navbar-brand-text">MediConnect</span>
        </Link>
        <div className="navbar-links">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link ${path === link.to || (link.to !== '/home' && path.startsWith(link.to)) ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="navbar-link"
              style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className={`navbar-link ${path === '/login' ? 'active' : ''}`}>
                Sign In
              </Link>
              <Link to="/register" className={`navbar-link ${path === '/register' ? 'active' : ''}`}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
