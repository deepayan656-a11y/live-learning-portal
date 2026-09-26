const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { verifyToken, authorizeRoles } = require('../authMiddleware');

// Configure file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 1. POST /api/v1/assignments (Instructor posts new homework)
router.post('/', verifyToken, authorizeRoles('instructor', 'admin'), async (req, res) => {
  let { title, instructions, due_date, max_score } = req.body;
  const instructor_id = req.user.user_id;

  if (!title || !instructions || !due_date) {
    return res.status(400).json({ error: 'Please provide title, instructions, and due_date.' });
  }

  // Convert HTML datetime-local (YYYY-MM-DDTHH:MM) to MySQL DATETIME format
  const formattedDueDate = due_date.replace('T', ' ');

  try {
    const [result] = await db.query(
      'INSERT INTO assignments (title, instructions, due_date, max_score, instructor_id) VALUES (?, ?, ?, ?, ?)',
      [title, instructions, formattedDueDate, parseInt(max_score) || 100, instructor_id]
    );

    res.status(201).json({
      message: 'Assignment successfully posted!',
      assignmentId: result.insertId
    });
  } catch (err) {
    console.error('Create Assignment Error:', err);
    res.status(500).json({ error: 'Database error occurred while posting assignment.', details: err.message });
  }
});

// 2. GET /api/v1/assignments (Fetches assignments for Student & Instructor profiles)
router.get('/', verifyToken, async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'student') {
      // Joins assignments with the individual student's submission history
      query = `
        SELECT a.*, s.status AS submission_status, s.grade_score, s.submitted_at
        FROM assignments a
        LEFT JOIN assignment_submissions s 
        ON a.assignment_id = s.assignment_id AND s.student_id = ?
        ORDER BY a.due_date ASC
      `;
      params.push(req.user.user_id);
    } else {
      query = 'SELECT * FROM assignments ORDER BY due_date ASC';
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch Assignments Error:', err);
    res.status(500).json({ error: 'Database error occurred while fetching assignments.', details: err.message });
  }
});

// 3. POST /api/v1/assignments/:id/submit (Student submits assignment)
router.post('/:id/submit', verifyToken, authorizeRoles('student'), upload.single('file'), async (req, res) => {
  const assignment_id = req.params.id;
  const student_id = req.user.user_id;
  const { external_link, submission_notes } = req.body;
  const file_path = req.file ? req.file.path : null;

  if (!file_path && !external_link) {
    return res.status(400).json({ error: 'Please upload a file or provide a project repository link.' });
  }

  try {
    const [existing] = await db.query(
      'SELECT * FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [assignment_id, student_id]
    );

    let result;
    if (existing.length > 0) {
      [result] = await db.query(
        'UPDATE assignment_submissions SET file_path = ?, external_link = ?, submission_notes = ?, status = "submitted", submitted_at = CURRENT_TIMESTAMP WHERE assignment_id = ? AND student_id = ?',
        [file_path || existing.file_path, external_link || existing.external_link, submission_notes || existing.submission_notes, assignment_id, student_id]
      );
    } else {
      [result] = await db.query(
        'INSERT INTO assignment_submissions (assignment_id, student_id, file_path, external_link, submission_notes) VALUES (?, ?, ?, ?, ?)',
        [assignment_id, student_id, file_path, external_link, submission_notes]
      );
    }

    res.status(201).json({
      message: 'Assignment submitted successfully!',
      submissionId: existing.length > 0 ? existing.submission_id : result.insertId
    });
  } catch (err) {
    console.error('Submission Error:', err);
    res.status(500).json({ error: 'Database error occurred during submission.', details: err.message });
  }
});

// 4. GET /api/v1/assignments/:id/submissions (Submissions for grading and peer gallery)
router.get('/:id/submissions', verifyToken, async (req, res) => {
  const assignment_id = req.params.id;
  const user_id = req.user.user_id;
  const role = req.user.role;

  try {
    let query;
    let params = [assignment_id];

    if (role === 'instructor' || role === 'admin') {
      query = `
        SELECT s.*, u.full_name AS student_name, u.email AS student_email
        FROM assignment_submissions s
        JOIN users u ON s.student_id = u.user_id
        WHERE s.assignment_id = ?
      `;
    } else {
      query = `
        SELECT s.*, u.full_name AS student_name
        FROM assignment_submissions s
        JOIN users u ON s.student_id = u.user_id
        WHERE s.assignment_id = ? AND (s.student_id = ? OR s.is_public_to_peers = TRUE)
      `;
      params.push(user_id);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch Submissions Error:', err);
    res.status(500).json({ error: 'Database error occurred while fetching submissions.', details: err.message });
  }
});

module.exports = router;