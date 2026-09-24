import React from 'react';
import { useNavigate } from 'react-router-dom';

// Import your black & blue logo
import logo from '../assets/logo.png';

export default function Navbar({ title }) {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <header className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white shadow-md border-b border-blue-400 px-6 py-4 flex items-center justify-between overflow-hidden">
      {/* Glassmorphism gradient glow overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

      {/* Left: Logo Container & Title */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="bg-white p-1.5 rounded-xl shadow-md border border-white/40 flex items-center justify-center">
          <img 
            src={logo} 
            alt="AvaIntern Logo" 
            className="h-10 w-auto object-contain" 
          />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide drop-shadow-sm">
            {title}
          </h1>
          <p className="text-xs text-blue-100 font-medium">
            Welcome back, <span className="font-bold text-white">{userName}</span>!
          </p>
        </div>
      </div>

      {/* Right: Bright Logout Button */}
      <button 
        onClick={handleLogout}
        className="relative z-10 text-sm font-semibold bg-white text-indigo-700 hover:bg-blue-50 px-4 py-2 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-1.5 hover:scale-105"
      >
        <span>Logout</span> ↳
      </button>
    </header>
  );
}