const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, authorizeRoles } = require('../authMiddleware');

// GET /api/v1/schedule/upcoming
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : 'student';
    const userCourse = req.user ? req.user.course_name : 'FULL STACK';

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
        title: session.title || '',
        description: session.description || '',
        course_name: session.course_name || 'FULL STACK',
        mentor_name: session.mentor_name || 'Assigned Mentor',
        start_time: session.start_time,
        duration_minutes: session.duration_minutes || 60,
        buttonState,
        canJoin,
        zoom_join_url: session.zoom_join_url || '',
        zoom_passcode: session.zoom_passcode || ''
      };
    });

    res.json(processedSessions);
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ error: `Database Error: ${err.sqlMessage || err.message}` });
  }
});

// POST /api/v1/schedule/create
router.post('/create', verifyToken, authorizeRoles('instructor', 'admin'), async (req, res) => {
  const { title, description, course_name, zoom_meeting_id, zoom_join_url, zoom_passcode, start_time, duration_minutes } = req.body;
if (!zoom_passcode) {
  zoom_passcode = 'learn123';
}
// Embed passcode into the Zoom URL so users aren't prompted manually
if (!zoom_join_url) {
  zoom_join_url = `https://zoom.us/j/${zoom_meeting_id}?pwd=${zoom_passcode}`;
}
  if (!title || !start_time) {
    return res.status(400).json({ error: 'Please provide title and start_time.' });
  }

  // 1. Format DATETIME string for MySQL (YYYY-MM-DD HH:MM:SS)
  let formattedStartTime = String(start_time).replace('T', ' ');
  if (formattedStartTime.length === 16) {
    formattedStartTime += ':00';
  }

  // 2. Extract instructor_id from JWT payload safely
  const instructorId = req.user ? (req.user.user_id || req.user.id) : null;
  if (!instructorId) {
    return res.status(400).json({ error: 'Instructor ID missing from token. Please log out and sign in again.' });
  }

  // 3. Fallbacks for optional parameters
  const titleVal = String(title).trim();
  const descVal = description ? String(description).trim() : '';
  const courseVal = course_name ? String(course_name).trim() : 'FULL STACK';
  const meetingIdVal = zoom_meeting_id ? String(zoom_meeting_id) : Math.floor(1000000000 + Math.random() * 9000000000).toString();
  const joinUrlVal = zoom_join_url ? String(zoom_join_url) : `https://zoom.us/j/${meetingIdVal}`;
  const passcodeVal = zoom_passcode ? String(zoom_passcode) : 'learn123';
  const durationVal = parseInt(duration_minutes, 10) || 60;

  try {
    const [result] = await db.query(
      `INSERT INTO live_sessions 
       (title, description, course_name, zoom_meeting_id, zoom_join_url, zoom_passcode, start_time, duration_minutes, instructor_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titleVal,
        descVal,
        courseVal,
        meetingIdVal,
        joinUrlVal,
        passcodeVal,
        formattedStartTime,
        durationVal,
        instructorId
      ]
    );

    res.status(201).json({
      message: `Live session successfully scheduled for ${courseVal}!`,
      sessionId: result.insertId
    });
  } catch (err) {
    console.error('SQL Execution Error:', err);
    res.status(500).json({ 
      error: `Database Error: ${err.sqlMessage || err.message}` 
    });
  }
});

module.exports = router;