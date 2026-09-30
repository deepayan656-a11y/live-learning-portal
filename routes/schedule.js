const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, authorizeRoles } = require('../authMiddleware');

// ==========================================
// 1. GET /api/v1/schedule/upcoming
// Fetches scheduled classes filtered strictly by student's course
// ==========================================
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const { user_id, role, course_name } = req.user;
    let query = '';
    let params = [];

    if (role === 'super_admin') {
      // Super Admin sees ALL sessions across all courses
      query = 'SELECT * FROM live_sessions ORDER BY start_time ASC';
    } else if (role === 'instructor' || role === 'admin') {
      // Mentor sees sessions created by them or for all courses
      query = 'SELECT * FROM live_sessions WHERE instructor_id = ? ORDER BY start_time ASC';
      params.push(user_id);
    } else {
      // 🎯 STUDENTS: See ONLY upcoming classes assigned to their specific enrolled course
      const studentCourse = course_name || 'FULL STACK';
      query = 'SELECT * FROM live_sessions WHERE course_name = ? AND start_time >= NOW() - INTERVAL 2 HOUR ORDER BY start_time ASC';
      params.push(studentCourse);
    }

    const [sessions] = await db.query(query, params);
    const currentTime = new Date();

    // Process dynamic button state (10-minute activation window)
    const processedSessions = sessions.map(session => {
      const startTime = new Date(session.start_time);
      const endTime = new Date(startTime.getTime() + (session.duration_minutes || 60) * 60 * 1000);
      const activationWindowStart = new Date(startTime.getTime() - 10 * 60 * 1000);

      let buttonState = 'Starts Soon';
      let canJoin = false;

      if (currentTime < activationWindowStart) {
        buttonState = 'Starts Soon';
        canJoin = false;
      } else if (currentTime >= activationWindowStart && currentTime <= endTime) {
        buttonState = 'Join Class Now';
        canJoin = true;
      } else {
        buttonState = 'Session Ended';
        canJoin = false;
      }

      return {
        session_id: session.session_id,
        title: session.title,
        description: session.description,
        course_name: session.course_name || 'FULL STACK',
        start_time: session.start_time,
        duration_minutes: session.duration_minutes,
        buttonState,
        canJoin,
        zoom_join_url: session.zoom_join_url,
        zoom_passcode: session.zoom_passcode
      };
    });

    res.json(processedSessions);
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ error: 'Database error occurred while fetching schedule.', details: err.message });
  }
});

// ==========================================
// 2. POST /api/v1/schedule/create
// Instructor / Admin endpoint to schedule a new class for a specific course
// ==========================================
router.post('/create', verifyToken, authorizeRoles('instructor', 'admin', 'super_admin'), async (req, res) => {
  let { title, description, course_name, zoom_meeting_id, zoom_join_url, zoom_passcode, start_time, duration_minutes } = req.body;

  if (!title || !start_time) {
    return res.status(400).json({ error: 'Please provide title and start_time.' });
  }

  // Format HTML datetime-local string (YYYY-MM-DDTHH:MM) for MySQL DATETIME
  const formattedStartTime = start_time.replace('T', ' ');
  const targetCourse = course_name || 'FULL STACK';

  // Auto-generate Zoom meeting defaults if missing
  if (!zoom_meeting_id) {
    zoom_meeting_id = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }
  if (!zoom_join_url) {
    zoom_join_url = `https://zoom.us/j/${zoom_meeting_id}`;
  }
  if (!zoom_passcode) {
    zoom_passcode = 'learn123';
  }

  try {
    const [result] = await db.query(
      'INSERT INTO live_sessions (title, description, course_name, zoom_meeting_id, zoom_join_url, zoom_passcode, start_time, duration_minutes, instructor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', targetCourse, zoom_meeting_id, zoom_join_url, zoom_passcode, formattedStartTime, parseInt(duration_minutes) || 60, req.user.user_id]
    );

    res.status(201).json({
      message: `Live session successfully scheduled for ${targetCourse}!`,
      sessionId: result.insertId
    });
  } catch (err) {
    console.error('Error scheduling session:', err);
    res.status(500).json({ error: 'Database error occurred while scheduling session.', details: err.message });
  }
});

module.exports = router;