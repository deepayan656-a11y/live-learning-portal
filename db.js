const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool to connect to our MySQL database
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Automatically create the attendance_logs table on startup if it doesn't exist
const initializeDatabase = async () => {
    try {
        // ADDED .promise() here to support async/await
        await pool.promise().query(`
            CREATE TABLE IF NOT EXISTS attendance_logs (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                student_id INT NOT NULL,
                join_time DATETIME NOT NULL,
                leave_time DATETIME DEFAULT NULL,
                duration_minutes INT DEFAULT 0,
                FOREIGN KEY (session_id) REFERENCES live_sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `);
        console.log('Database tables verified successfully!');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
};

initializeDatabase();
module.exports = pool.promise();