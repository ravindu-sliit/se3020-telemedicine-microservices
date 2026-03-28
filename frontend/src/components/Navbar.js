import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHeartbeat } from 'react-icons/fa';

const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;

  const links = [
    { to: '/home', label: 'Home' },
    { to: '/patient/book-appointment', label: 'Appointment' },
    { to: '/patient/prescriptions', label: 'Prescription' },
    { to: '/patient/profile', label: 'Profile' },
  ];

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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
