const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, authorizeRoles } = require('../authMiddleware');

// ==========================================
// 1. GET /api/v1/schedule/upcoming
// Fetches scheduled classes and calculates dynamic session join / active status.
// New students only see sessions scheduled AFTER their registration date.
// ==========================================
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'student') {
      // Filter so newly registered students only see live classes scheduled after their account creation date
      query = `
        SELECT ls.session_id, ls.title, ls.description, ls.zoom_meeting_id, ls.zoom_join_url, ls.zoom_passcode, ls.start_time, ls.duration_minutes
        FROM live_sessions ls
        JOIN users u ON u.user_id = ?
        WHERE ls.start_time >= u.created_at
        ORDER BY ls.start_time ASC
      `;
      params.push(req.user.user_id);
    } else {
      // Instructors and Admins view all scheduled live sessions
      query = `
        SELECT session_id, title, description, zoom_meeting_id, zoom_join_url, zoom_passcode, start_time, duration_minutes 
        FROM live_sessions 
        ORDER BY start_time ASC
      `;
    }

    const [sessions] = await db.query(query, params);

    const currentTime = new Date();

    // Process dynamic 10-minute activation window and status labels
    const processedSessions = sessions.map(session => {
      const startTime = new Date(session.start_time);
      const endTime = new Date(startTime.getTime() + session.duration_minutes * 60 * 1000);
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
// Instructor / Admin endpoint to create and sync a new Zoom live session
// ==========================================
router.post('/create', verifyToken, authorizeRoles('instructor', 'admin'), async (req, res) => {
  let { title, description, zoom_meeting_id, zoom_join_url, zoom_passcode, start_time, duration_minutes } = req.body;

  // 1. Title and Start Time are required fields
  if (!title || !start_time) {
    return res.status(400).json({ error: 'Please provide title and start_time.' });
  }

  // 2. Fallbacks for Zoom meeting details if omitted by frontend form
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
      'INSERT INTO live_sessions (title, description, zoom_meeting_id, zoom_join_url, zoom_passcode, start_time, duration_minutes, instructor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', zoom_meeting_id, zoom_join_url, zoom_passcode, start_time, duration_minutes || 60, req.user.user_id]
    );

    res.status(201).json({
      message: 'Live session successfully scheduled and synchronized!',
      sessionId: result.insertId
    });
  } catch (err) {
    console.error('Schedule Create Error:', err);
    res.status(500).json({ error: 'Database error occurred while scheduling session.', details: err.message });
  }
});

module.exports = router;