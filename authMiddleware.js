const jwt = require('jsonwebtoken');
const db = require('./db'); // Needed to check course permissions in MySQL

// 1. Verify if user is logged in via JWT Token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // Safely extract token after 'Bearer '
    const token = authHeader && authHeader.split(' ').at(1); 

    if (!token) {
        return res.status(401).json({ error: 'Access Denied. Please log in first.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attaches user_id and role to req.user
        next();
    } catch (err) {
        res.status(403).json({ error: 'Session expired or invalid token.' });
    }
};

// 2. Middleware to restrict routes based on User Roles ('super_admin', 'admin', 'instructor', 'student')
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Super Admin gets access to all restricted routes by default
        if (req.user && req.user.role === 'super_admin') {
            return next();
        }

        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied: Insufficient permissions.' });
        }
        next();
    };
};

// 3. NEW: Middleware for Course / Department-Level Access Control
const checkCourseAccess = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const userRole = req.user.role;
        const courseId = req.params.courseId || req.body.course_id;

        // Super Admin bypasses department-level checks
        if (userRole === 'super_admin') {
            return next();
        }

        if (!courseId) {
            return res.status(400).json({ error: 'Course ID is required for validation.' });
        }

        // Verify if this Admin / Instructor is assigned to this course in user_courses table
        const [rows] = await db.query(
            'SELECT * FROM user_courses WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        );

        if (rows.length === 0) {
            return res.status(403).json({ error: 'Access Denied: You are not authorized to manage this department/course.' });
        }

        next();
    } catch (err) {
        res.status(500).json({ error: 'Internal server error checking course permissions.' });
    }
};

// Export all three functions
module.exports = { verifyToken, authorizeRoles, checkCourseAccess };