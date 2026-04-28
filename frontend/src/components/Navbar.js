import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHeartbeat } from 'react-icons/fa';
import { clearSession, getSession } from '../services/session';

const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;
  const session = getSession();
  const isLoggedIn = Boolean(session?.token);
  const isPatient = session?.user?.role === 'patient';
  const isLandingPage = path === '/';
  const isHomePage = path === '/home';
  const hideForRoleDashboards = path.startsWith('/admin') || path.startsWith('/doctor');

  if (hideForRoleDashboards) {
    return null;
  }

  const links = isPatient
    ? [
        { to: '/home', label: 'Home' },
        { to: '/patient', label: 'Dashboard' },
        { to: '/patient/book-appointment', label: 'Appointment' },
        { to: '/patient/symptom-checker', label: 'Symptom Checker' },
        { to: '/patient/profile', label: 'Profile' },
      ]
    : [{ to: '/home', label: 'Home' }];

  const handleLogout = () => {
    clearSession();
    window.location.href = '/';
  };

  const isLinkActive = linkTo => {
    if (linkTo === '/patient') {
      return path === '/patient';
    }
    return path === linkTo || (linkTo !== '/home' && path.startsWith(linkTo));
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
          {isLandingPage ? (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm" style={{ marginRight: 8 }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {isLoggedIn ? (
                <>
                  {links.map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`navbar-link ${isLinkActive(link.to) ? 'active' : ''}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn-danger btn-sm"
                    style={{ marginLeft: 8 }}
                  >
                    Logout
                  </button>
                </>
              ) : !isHomePage ? (
                <>
                  <Link to="/login" className="btn btn-secondary btn-sm" style={{ marginRight: 8 }}>
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Sign Up
                  </Link>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
