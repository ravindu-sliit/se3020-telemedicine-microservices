import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './theme.css';

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

function App() {
  // For demo purposes, set a default role
  React.useEffect(() => {
    if (!localStorage.getItem('userRole')) {
      localStorage.setItem('userRole', 'patient');
    }
  }, []);

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
          <Route path="/patient" element={<Patient />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
          <Route path="/patient/symptom-checker" element={<SymptomChecker />} />
          <Route path="/patient/book-appointment" element={<BookAppointment />} />
          
          {/* Doctor Routes */}
          <Route path="/doctor" element={<Doctor />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<Admin />} />
          
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
