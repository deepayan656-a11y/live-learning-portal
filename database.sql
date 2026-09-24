-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS live_portal;
USE live_portal;
-- 1. Update Role ENUM in users table
ALTER TABLE users 
MODIFY COLUMN role ENUM('student', 'instructor', 'admin', 'super_admin') DEFAULT 'student';

-- 2. Create Courses / Departments Table
CREATE TABLE courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'CS101', 'ME202'
    course_name VARCHAR(150) NOT NULL,       -- e.g., 'Computer Science Engineering'
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Link Users to Courses (Mapping Table)
CREATE TABLE user_courses (
    mapping_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- 4. Add course_id to live_sessions and assignments
ALTER TABLE live_sessions ADD COLUMN course_id INT NULL,
ADD FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE;

ALTER TABLE assignments ADD COLUMN course_id INT NULL,
ADD FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE;
-- 1. Users Table (Stores students, instructors, and admins)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'instructor', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Zoom Live Sessions Table (Stores virtual classes)
CREATE TABLE live_sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    zoom_meeting_id VARCHAR(100) NOT NULL,
    zoom_join_url TEXT NOT NULL,
    zoom_passcode VARCHAR(50),
    start_time DATETIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    instructor_id INT NOT NULL,
    FOREIGN KEY (instructor_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Assignments Table (Stores assignment details)
CREATE TABLE assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    due_date DATETIME NOT NULL,
    max_score INT DEFAULT 100,
    instructor_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 4. Assignment Submissions Table (Stores homework uploads)
CREATE TABLE assignment_submissions (
    submission_id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    file_path TEXT,
    external_link TEXT,
    submission_notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('submitted', 'under_review', 'graded', 'resubmit_required') DEFAULT 'submitted',
    is_public_to_peers BOOLEAN DEFAULT FALSE,
    grade_score INT NULL,
    instructor_feedback TEXT NULL,
    FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);