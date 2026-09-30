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

    if (role === 'instructor' || role === 'admin') {
      // Fetch all sessions with mentor name joined from users table
      query = `
        SELECT ls.*, u.full_name AS mentor_name 
        FROM live_sessions ls 
        LEFT JOIN users u ON ls.instructor_id = u.user_id 
        ORDER BY ls.start_time ASC
      `;
    } else {
      // Fetch course-isolated sessions with mentor name for students
      const studentCourse = course_name || 'FULL STACK';
      query = `
        SELECT ls.*, u.full_name AS mentor_name 
        FROM live_sessions ls 
        LEFT JOIN users u ON ls.instructor_id = u.user_id 
        WHERE ls.course_name = ? AND ls.start_time >= NOW() - INTERVAL 2 HOUR 
        ORDER BY ls.start_time ASC
      `;
      params.push(studentCourse);
    }

    const [sessions] = await db.query(query, params);
    const currentTime = new Date();

    const processedSessions = sessions.map(session => {
      const startTime = new Date(session.start_time);
      const endTime = new Date(startTime.getTime() + (session.duration_minutes || 60) * 60 * 1000);
      const activationWindowStart = new Date(startTime.getTime() - 10 * 60 * 1000);

      let buttonState = 'Starts Soon';
      let canJoin = false;

      if (currentTime < activationWindowStart) {
        buttonState = 'Starts Soon';
      } else if (currentTime >= activationWindowStart && currentTime <= endTime) {
        buttonState = 'Join Class Now';
        canJoin = true;
      } else {
        buttonState = 'Session Ended';
      }

      return {
        session_id: session.session_id,
        title: session.title,
        description: session.description,
        course_name: session.course_name,
        mentor_name: session.mentor_name || 'Assigned Mentor', // 👈 Includes Mentor Name
        start_time: session.start_time,
        duration_minutes: session.duration_minutes,
        buttonState,
        canJoin,
        zoom_join_url: session.zoom_join_url
      };
    });

    res.json(processedSessions);
  } catch (err) {
    res.status(500).json({ error: 'Database error occurred while fetching schedule.' });
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