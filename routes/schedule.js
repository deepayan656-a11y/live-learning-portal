const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, authorizeRoles } = require('../authMiddleware');

// GET /api/v1/schedule/upcoming
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userCourse = req.user.course_name;
    const userId = req.user.user_id || req.user.id;

    let query = '';
    let params = [];

    if (userRole === 'instructor' || userRole === 'admin') {
      query = `
        SELECT ls.*, u.full_name AS mentor_name 
        FROM live_sessions ls 
        LEFT JOIN users u ON ls.instructor_id = u.user_id 
        ORDER BY ls.start_time ASC
      `;
    } else {
      const studentCourse = userCourse || 'FULL STACK';
      query = `
        SELECT ls.*, u.full_name AS mentor_name 
        FROM live_sessions ls 
        LEFT JOIN users u ON ls.instructor_id = u.user_id 
        WHERE (ls.course_name = ? OR ls.course_name IS NULL) 
          AND ls.start_time >= NOW() - INTERVAL 2 HOUR 
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
        course_name: session.course_name || 'FULL STACK',
        mentor_name: session.mentor_name || 'Assigned Mentor',
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

// POST /api/v1/schedule/create
router.post('/create', verifyToken, authorizeRoles('instructor', 'admin'), async (req, res) => {
  let { title, description, course_name, zoom_meeting_id, zoom_join_url, zoom_passcode, start_time, duration_minutes } = req.body;

  if (!title || !start_time) {
    return res.status(400).json({ error: 'Please provide title and start_time.' });
  }

  // 1. Format start_time safely for MySQL DATETIME (YYYY-MM-DD HH:MM:00)
  let formattedStartTime = start_time.replace('T', ' ');
  if (formattedStartTime.length === 16) {
    formattedStartTime += ':00';
  }

  // 2. Extract valid instructor_id from JWT payload
  const instructorId = req.user.user_id || req.user.id;
  if (!instructorId) {
    return res.status(400).json({ error: 'Invalid instructor session. Please log out and log in again.' });
  }

  const targetCourse = course_name || 'FULL STACK';

  // 3. Defaults for Zoom credentials
  if (!zoom_meeting_id) zoom_meeting_id = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  if (!zoom_join_url) zoom_join_url = `https://zoom.us/j/${zoom_meeting_id}`;
  if (!zoom_passcode) zoom_passcode = 'learn123';

  try {
    const [result] = await db.query(
      `INSERT INTO live_sessions 
       (title, description, course_name, zoom_meeting_id, zoom_join_url, zoom_passcode, start_time, duration_minutes, instructor_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || '', targetCourse, zoom_meeting_id, zoom_join_url, zoom_passcode, formattedStartTime, parseInt(duration_minutes) || 60, instructorId]
    );

    res.status(201).json({
      message: `Live session successfully scheduled for ${targetCourse}!`,
      sessionId: result.insertId
    });
  } catch (err) {
    console.error('SQL Error while scheduling:', err.sqlMessage || err.message);
    res.status(500).json({ 
      error: err.sqlMessage || err.message || 'Database error occurred while scheduling session.' 
    });
  }
});

module.exports = router;