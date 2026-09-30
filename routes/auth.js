const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// ==========================================
// 1. POST /api/v1/auth/signup
// Registers a new user (Student, Instructor, or Admin) with course assignment
// ==========================================
router.post('/signup', async (req, res) => {
  const { full_name, email, password, role, course_name } = req.body;

  // Basic validation
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Please provide full_name, email, and password.' });
  }

  try {
    // Check if email is already registered
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'This email address is already registered.' });
    }

    // Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default values
    const userRole = role || 'student';
    const userCourse = course_name || 'Full Stack Web Development (MERN)';

    // Insert user into database including course_name
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password_hash, role, course_name) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, hashedPassword, userRole, userCourse]
    );

    res.status(201).json({
      message: 'Student account created successfully!',
      userId: result.insertId
    });
  } catch (err) {
    console.error('Signup Database Error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'This email is already registered.' });
    }
    res.status(500).json({ error: 'Database error occurred during signup.', details: err.message });
  }
});

// ==========================================
// 2. POST /api/v1/auth/login
// Verifies user and returns JWT token containing course_name
// ==========================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password.' });
  }

  try {
    // Look up user by email
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Extract the single user object from the rows array
    const user = rows[0];

    // Check account status if is_active column exists
    if (user.is_active !== undefined && user.is_active === 0) {
      return res.status(403).json({ error: 'Your account access has been revoked by Super Admin.' });
    }

    // Compare password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token containing user_id, role, and course_name
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
        course_name: user.course_name || 'Full Stack Web Development (MERN)'
      },
      process.env.JWT_SECRET || 'super_secret_key_for_portal_tokens',
      { expiresIn: '24h' }
    );

    // Return response with user details
    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        course_name: user.course_name || 'Full Stack Web Development (MERN)'
      }
    });
  } catch (err) {
    console.error('Login Database Error:', err);
    res.status(500).json({ error: 'Database error occurred during login.', details: err.message });
  }
});

module.exports = router;