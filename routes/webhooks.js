const express = require('express');
const router = express.Router();
const db = require('../db');

// ==========================================
// POST /api/v1/zoom/webhook
// Receiver for Zoom Webhook events
// ==========================================
router.post('/webhook', async (req, res) => {
    const { event, payload } = req.body;

    // Verify we have a valid payload
    if (!event || !payload || !payload.object) {
        return res.status(400).json({ error: 'Invalid webhook payload structure.' });
    }

    const meetingId = payload.object.id;
    const participantEmail = payload.object.participant.email;
    const eventTime = new Date(payload.object.participant.date_time || new Date());

    try {
        // 1. Fetch user_id from database using the attendee's email address
        const [users] = await db.query('SELECT user_id FROM users WHERE email = ?', [participantEmail]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User associated with webhook email not found.' });
        }
        const student_id = users.at(0).user_id;

        // 2. Fetch session_id associated with the Zoom Meeting ID
        const [sessions] = await db.query('SELECT session_id FROM live_sessions WHERE zoom_meeting_id = ?', [meetingId]);
        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Live session associated with meeting ID not found.' });
        }
        const session_id = sessions.at(0).session_id;

        if (event === 'meeting.participant_joined') {
            // Student Joined: Log their initial entry
            await db.query(
                'INSERT INTO attendance_logs (session_id, student_id, join_time) VALUES (?, ?, ?)',
                [session_id, student_id, eventTime]
            );
            console.log(`[Attendance] Student ID ${student_id} joined session ${session_id}`);
            return res.status(200).json({ message: 'Join log recorded.' });

        } else if (event === 'meeting.participant_left') {
            // Student Left: Retrieve their latest join record
            const [logs] = await db.query(
                'SELECT * FROM attendance_logs WHERE session_id = ? AND student_id = ? AND leave_time IS NULL ORDER BY log_id DESC LIMIT 1',
                [session_id, student_id]
            );

            if (logs.length > 0) {
                const log = logs.at(0);
                const joinTime = new Date(log.join_time);
                
                // Calculate difference in minutes
                const differenceMs = eventTime - joinTime;
                const durationMinutes = Math.max(1, Math.round(differenceMs / 1000 / 60)); // Minimum of 1 minute log

                await db.query(
                    'UPDATE attendance_logs SET leave_time = ?, duration_minutes = ? WHERE log_id = ?',
                    [eventTime, durationMinutes, log.log_id]
                );
                console.log(`[Attendance] Student ID ${student_id} left session ${session_id}. Duration: ${durationMinutes} mins`);
                return res.status(200).json({ message: 'Leave log updated.' });
            } else {
                return res.status(404).json({ error: 'No active join log found for this student.' });
            }
        }

        res.status(200).json({ message: 'Event ignored.' });
    } catch (err) {
        console.error('Webhook processing error:', err);
        res.status(500).json({ error: 'Database processing error', details: err.message });
    }
});

module.exports = router;