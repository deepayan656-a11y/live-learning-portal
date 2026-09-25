const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// POST /api/v1/auth/signup
router.post('/signup', async (req, res) => {
  const { full_name, email, password, role } = req.body;

  // 1. Field Validation
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Please provide full_name, email, and password.' });
  }

  try {
    // 2. Check if email already exists in MySQL
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'This email address is already registered. Please sign in or use a different email.' });
    }

    // 3. Hash password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insert new user profile
    const userRole = role || 'student';
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [full_name, email, hashedPassword, userRole]
    );

    res.status(201).json({
      message: 'Student account created successfully!',
      userId: result.insertId
    });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ error: 'Database error during signup: ' + err.message });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const user = rows;
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET || 'super_secret_key_for_portal_tokens',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.user_id,
        user_id: user.user_id,
        full_name: user.full_name,
        userName: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Database error during login: ' + err.message });
  }
});

module.exports = router;
Step 2: Replace client/src/pages/Login.jsx (Frontend)
Update client/src/pages/Login.jsx so that handleSignUp displays the exact error message returned by the server instead of a generic fallback
:
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up State
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  // Status Messages & Loading State
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

      const token = res.data.token;
      const userObj = res.data.user || res.data;

      const role = userObj.role || res.data.role || 'student';
      const userName = userObj.full_name || userObj.userName || res.data.userName || 'Student';
      const userEmail = userObj.email || res.data.email || email;
      const userId = userObj.id || userObj.user_id || res.data.user_id;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userName', userName);
      localStorage.setItem('userEmail', userEmail);
      if (userId) localStorage.setItem('userId', userId);

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

      setSuccess('Student profile created! Please sign in with your new credentials.');
      setEmail(signUpEmail);
      setFullName('');
      setSignUpEmail('');
      setSignUpPassword('');

      setTimeout(() => {
        setIsSignUp(false);
      }, 1500);
    } catch (err) {
      console.error('Sign Up Error:', err);
      // Display the actual error message returned from backend
      setError(err.response?.data?.error || err.message || 'Registration failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-blue-100 max-w-md w-full">
        
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <img src={logo} alt="Portal Logo" className="h-10 w-auto mx-auto mb-2 object-contain" />
          <h2 className="text-2xl font-extrabold text-blue-950">Live Learning Portal</h2>
          <p className="text-xs text-blue-600 mt-1">
            {isSignUp ? 'Register a new student profile' : 'Sign in to access your personal student portal'}
          </p>
        </div>

        {/* Tab Toggle */}
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

        {error && <div className="mb-4 text-xs p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 font-medium">{error}</div>}
        {success && <div className="mb-4 text-xs p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">{success}</div>}

        {/* SIGN IN FORM */}
        {!isSignUp ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email" required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="you@portal.com" value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password" required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition">
              {loading ? 'Signing in...' : 'Sign In to Portal →'}
            </button>
          </form>
        ) : (
          /* NEW STUDENT SIGN UP FORM */
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <input
                type="text" required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="e.g. Rahul Sharma" value={fullName} onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Desired Email Address</label>
              <input
                type="email" required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="unique.email@portal.com" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password" required minLength="6"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="At least 6 characters" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition">
              {loading ? 'Creating Account...' : 'Create Student Profile ✨'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
