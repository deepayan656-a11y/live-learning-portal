// routes/superAdmin.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, authorizeRoles } = require('../authMiddleware');

// Only Super Admin can create courses
router.post('/courses/create', verifyToken, authorizeRoles('super_admin'), async (req, res) => {
  const { course_code, course_name, department } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO courses (course_code, course_name, department) VALUES (?, ?, ?)',
      [course_code, course_name, department]
    );
    res.status(201).json({ message: 'Course created successfully', courseId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Database error creating course' });
  }
});

// Assign a Faculty member as Admin to a specific course
router.post('/assign-faculty-admin', verifyToken, authorizeRoles('super_admin'), async (req, res) => {
  const { user_id, course_id } = req.body;
  try {
    await db.query('UPDATE users SET role = "admin" WHERE user_id = ?', [user_id]);
    await db.query('INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)', [user_id, course_id]);
    res.json({ message: 'Faculty granted Admin access for specified course.' });
  } catch (err) {
    res.status(500).json({ error: 'Error assigning course admin' });
  }
});

module.exports = router;