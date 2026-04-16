import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './theme.css';
import { getSession } from './services/session';

// Import pages
import Landing from './pages/Landing';
import Home from './pages/Home';
import Patient from './pages/Patient';
import PatientProfile from './pages/PatientProfile';
import Auth from './pages/Auth';
import Doctor from './pages/Doctor';
import Admin from './pages/Admin';
import BookAppointment from './pages/BookAppointment';
import TelemedicineRoom from './pages/TelemedicineRoom';
import SymptomChecker from './pages/SymptomChecker';
import { PaymentSuccess, PaymentCancel } from './pages/PaymentStatus';

const roleHomePath = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'doctor') return '/doctor';
  if (role === 'patient') return '/patient';
  return '/home';
};

const RoleProtectedRoute = ({ allowedRoles, element }) => {
  const session = getSession();
  const userRole = session?.user?.role;

  if (!session?.token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={roleHomePath(userRole)} replace />;
  }

  return element;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          
          {/* Direct Routes - No authentication required */}
          <Route path="/home" element={<Home />} />
          
          {/* Patient Routes */}
          <Route
            path="/patient"
            element={<RoleProtectedRoute allowedRoles={['patient']} element={<Patient />} />}
          />
          <Route
            path="/patient/profile"
            element={<RoleProtectedRoute allowedRoles={['patient']} element={<PatientProfile />} />}
          />
          <Route
            path="/patient/symptom-checker"
            element={<RoleProtectedRoute allowedRoles={['patient']} element={<SymptomChecker />} />}
          />
          <Route
            path="/patient/book-appointment"
            element={<RoleProtectedRoute allowedRoles={['patient']} element={<BookAppointment />} />}
          />
          <Route
            path="/payments/success"
            element={<PaymentSuccess />}
          />
          <Route
            path="/payments/cancel"
            element={<PaymentCancel />}
          />
          
          {/* Doctor Routes */}
          <Route
            path="/doctor"
            element={<RoleProtectedRoute allowedRoles={['doctor']} element={<Doctor />} />}
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={<RoleProtectedRoute allowedRoles={['admin']} element={<Admin />} />}
          />
          
          {/* Shared Routes */}
          <Route path="/telemedicine-room" element={<TelemedicineRoom />} />
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
