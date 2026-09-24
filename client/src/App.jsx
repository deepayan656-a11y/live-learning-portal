import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/instructor" element={<InstructorDashboard />} />

        {/* Fallback Catchall redirects to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;