const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// POST /api/v1/auth/signup
// Registers a new user (Student, Instructor, or Admin)
router.post('/signup', async (req, res) => {
    const { full_name, email, password, role } = req.body;

    // 1. Basic validation
    if (!full_name || !email || !password) {
        return res.status(400).json({ error: 'Please provide full_name, email, and password.' });
    }

    try {
        // 2. Hash the password securely so it isn't saved in plain text
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert user details into the 'users' database table
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [full_name, email, hashedPassword, role || 'student']
        );

        res.status(201).json({ 
            message: 'User registered successfully!', 
            userId: result.insertId 
        });
    } catch (err) {
        console.error("Signup Database Error:", err);

        // Handle duplicate email database error
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'This email is already registered.' });
        }
        res.status(500).json({ error: 'Database error occurred during signup.', details: err.message });
    }
});

// POST /api/v1/auth/login
// Verifies user and returns a JSON Web Token (JWT)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    try {
        // 2. Look up the user by email
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // --- THE FIXED LINE: Extract the single user object from the array ---
        const user = rows[0];

        // 3. Compare submitted password with the hashed database password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // 4. Generate a JWT secure token containing the user's ID and Role
        const token = jwt.sign(
            { user_id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 5. Send back success message, token, and user details
        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Login Database Error:", err);
        res.status(500).json({ error: 'Database error occurred during login.', details: err.message });
    }
});

module.exports = router;