/* global globalThis */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHeartbeat } from 'react-icons/fa';
import { clearSession, getSession } from '../services/session';

const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;
  const session = getSession();
  const isLoggedIn = Boolean(session?.token);
  const isHomePage = path === '/home';
  const hideForRoleDashboards = path.startsWith('/admin') || path.startsWith('/doctor');

  if (hideForRoleDashboards) {
    return null;
  }

  const links = [
    { to: '/home', label: 'Home' },
    { to: '/patient/book-appointment', label: 'Appointment' },
    { to: '/patient/medical-history', label: 'Medical History' },
    { to: '/patient/symptom-checker', label: 'Symptom Checker' },
    { to: '/patient/profile', label: 'Profile' },
  ];

  const handleLogout = () => {
    clearSession();
    globalThis.location.href = '/';
  };

  let rightContent = null;
  if (isLoggedIn) {
    rightContent = (
      <>
        {links.map((link) => {
          const isActive = path === link.to || (link.to !== '/home' && path.startsWith(link.to));

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-danger btn-sm"
          style={{ marginLeft: 8 }}
        >
          Logout
        </button>
      </>
    );
  } else if (!isHomePage) {
    rightContent = (
      <>
        <Link to="/login" className="btn btn-secondary btn-sm" style={{ marginRight: 8 }}>
          Sign In
        </Link>
        <Link to="/register" className="btn btn-primary btn-sm">
          Sign Up
        </Link>
      </>
    );
  }

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
          {rightContent}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
