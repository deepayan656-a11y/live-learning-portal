import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, GraduationCap } from 'lucide-react';

// Import logo from assets with fallback
import logo from '../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/v1/auth/login', {
        email,
        password
      });

      console.log("Backend response data:", response.data);

      const token = response.data.token;
      const role = response.data.role || response.data.user?.role;
      const name = response.data.name || response.data.full_name || response.data.user?.full_name || response.data.user?.name;

      if (!token || !role) {
        throw new Error("Invalid response structure. Missing token or user role.");
      }

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userName', name || 'User'); 

      if (role === 'instructor' || role === 'super_admin') {
        navigate('/instructor');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to authenticate. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  // One-click demo credentials helper
  const fillDemoStudent = () => {
    setEmail('student@portal.com');
    setPassword('student123');
    setError('');
  };

  const fillDemoInstructor = () => {
    setEmail('instructor@portal.com');
    setPassword('instructor123');
    setError('');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50">
      
      {/* Decorative Ambient Background Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[30%] right-[15%] w-[300px] h-[300px] bg-sky-300/30 rounded-full blur-2xl pointer-events-none" />

      {/* Main Frosted Glass Login Card */}
      <div className="relative z-10 bg-white/85 backdrop-blur-xl max-w-md w-full p-8 rounded-3xl shadow-2xl border border-white/80 text-center">
        
        {/* Top Portal Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold tracking-wide uppercase mb-4">
          <Sparkles size={13} className="text-blue-600" /> Live Learning Portal
        </div>

        {/* Logo Container */}
        <div className="relative mx-auto mb-3 p-3 bg-gradient-to-b from-white to-blue-50/60 rounded-2xl border border-blue-100 shadow-md inline-block">
          <img 
            src={logo} 
            alt="AvaIntern Logo" 
            className="h-12 w-auto object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/logo.png';
            }}
          />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Welcome Back
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-500 mb-6">
          Sign in to access your live classes, recordings & coursework
        </p>

        {/* Form Error Alert */}
        {error && (
          <div className="mb-4 text-xs p-3 rounded-xl bg-red-50/90 text-red-600 border border-red-200 text-left font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          
          {/* Email Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="you@portal.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input with Visibility Toggle */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-indigo-200"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Quick Demo Credentials Panel */}
        <div className="mt-6 pt-5 border-t border-slate-200/60">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            ⚡ Quick Demo Auto-Fill
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillDemoStudent}
              className="px-3 py-1.5 bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100 transition flex items-center justify-center gap-1.5"
            >
              <GraduationCap size={14} /> Student
            </button>
            <button
              type="button"
              onClick={fillDemoInstructor}
              className="px-3 py-1.5 bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-100 transition flex items-center justify-center gap-1.5"
            >
              <ShieldCheck size={14} /> Instructor
            </button>
          </div>
        </div>

        <p className="mt-5 text-[11px] text-slate-400">
          AvaIntern Synchronous Learning & Assessment System
        </p>

      </div>
    </div>
  );
}