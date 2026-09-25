import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);

  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up Form State
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  // Feedback Messages & Loading State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Handle Sign In Request
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/v1/auth/login`, { email, password });

      // Fail-safe extraction (handles both flat and nested backend response formats)
      const token = res.data.token;
      const userObj = res.data.user || res.data;

      const role = userObj.role || res.data.role || 'student';
      const userName = userObj.full_name || userObj.userName || res.data.userName || 'Student';
      const userEmail = userObj.email || res.data.email || email;
      const userId = userObj.id || userObj.user_id || res.data.user_id;

      // Save valid session details to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userName', userName);
      localStorage.setItem('userEmail', userEmail);
      if (userId) localStorage.setItem('userId', userId);

      // Navigate based on user role
      if (role === 'instructor' || role === 'admin') {
        navigate('/instructor');
      } else {
        navigate('/student');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle New Student Registration Request
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post(`${API_BASE}/api/v1/auth/signup`, {
        full_name: fullName,
        email: signUpEmail,
        password: signUpPassword,
        role: 'student'
      });

      setSuccess('Student profile created! Please sign in with your email and password.');
      setEmail(signUpEmail);
      setFullName('');
      setSignUpEmail('');
      setSignUpPassword('');

      // Auto switch back to Sign In tab after 1.5 seconds
      setTimeout(() => {
        setIsSignUp(false);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Email address may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-blue-100 max-w-md w-full">
        
        {/* Branding Logo & Header */}
        <div className="text-center mb-6">
          <img src={logo} alt="Portal Logo" className="h-10 w-auto mx-auto mb-2 object-contain" />
          <h2 className="text-2xl font-extrabold text-blue-950">Live Learning Portal</h2>
          <p className="text-xs text-blue-600 mt-1">
            {isSignUp ? 'Register a new student profile' : 'Sign in to access your personal student workspace'}
          </p>
        </div>

        {/* Tab Toggle Controls */}
        <div className="flex bg-blue-50/80 p-1 rounded-xl mb-6 border border-blue-100">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              !isSignUp ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-700 hover:text-blue-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              isSignUp ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-700 hover:text-blue-900'
            }`}
          >
            New Student Sign Up
          </button>
        </div>

        {/* Status Messages */}
        {error && <div className="mb-4 text-xs p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 font-medium">{error}</div>}
        {success && <div className="mb-4 text-xs p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">{success}</div>}

        {/* SIGN IN FORM */}
        {!isSignUp ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email" 
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="you@portal.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password" 
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In to Portal →'}
            </button>
          </form>
        ) : (
          /* NEW STUDENT SIGN UP FORM */
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <input
                type="text" 
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="e.g. Rahul Sharma" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Desired Email Address</label>
              <input
                type="email" 
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="rahul@portal.com" 
                value={signUpEmail} 
                onChange={(e) => setSignUpEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password" 
                required 
                minLength="6"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="At least 6 characters" 
                value={signUpPassword} 
                onChange={(e) => setSignUpPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Student Profile ✨'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}