import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login & Sign Up Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Portal Workspaces */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/instructor" element={<InstructorDashboard />} />

        {/* Catchall Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;