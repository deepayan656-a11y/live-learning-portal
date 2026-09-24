Live Learning & Assignment Portal
A production-grade, unified educational management platform designed to bridge real-time virtual classroom instruction with structured homework submission, evaluation, and peer-learning workflows. This application integrates with the Zoom Meeting Web SDK and features a centralized Assignment Submission Gallery with secure Role-Based Access Controls (RBAC).

🚀 Key Features
Role-Based Access Control (RBAC): Strict separation of layouts, actions, and dashboard views across Students and Instructors to prevent unauthorized access.
Dynamic Zoom Live Schedule:
Displays upcoming classes fetched dynamically.
Real-time join-link evaluator that activates a styled "Join Class Now" button exactly 10 minutes before a session starts, displaying "Starts Soon" beforehand, and "Session Ended" once the class duration has elapsed.
Captures live webhooks to record student class attendance durations automatically.
Student Assignment Workspace:
Visual submission hub allowing students to submit external repository links (e.g., GitHub, Drive) or upload coursework files.
Live status indicators tracing assignments through Pending, Submitted, Graded, or Resubmit states.
Instructor Console:
Classroom Manager: Dynamically schedule Zoom live sessions with automatic database synchronization.
Assignment Creator: Post homework prompts, specify guidelines, due dates, and max marks.
Grading Workstation: Evaluate submitted code repositories, attach numeric marks, save qualitative text feedback, and toggle exemplary submissions to be public to peers.
Peer Learning Gallery:
A shared portfolio hub where students can browse outstanding solutions flagged as public by instructors, studying peer code layouts and mentor feedback.
🛠️ Technology Stack
Layer	Technology	Purpose
Frontend	React.js, Tailwind CSS (v4), Lucide Icons, Axios	Responsive UX/UI, dynamic schedules, real-time timer tracking
Backend	Node.js, Express.js	RESTful API routes, JWT-based security middleware
Database	MySQL (XAMPP)	Relational storage for users, live sessions, assignments, and grades
Video Integration	Zoom Web SDK & S2S OAuth	Automated session initialization and join signature calculations
📂 Database Architecture (MySQL Schema)
The database consists of four core relational tables linked to maintain system integrity:

-- 1. Users Table
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'instructor', 'admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Zoom Live Sessions Table
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

-- 3. Assignments Definition Table
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

-- 4. Student Assignment Submissions Table
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
🔌 API Endpoints Mapping
Authentication Routes
POST /api/v1/auth/signup - Registers a new student/instructor.
POST /api/v1/auth/login - Authenticates credentials and returns a secure JWT token, user role, and full name.
Schedule & Live System
GET /api/v1/schedule/upcoming - Fetches all upcoming classes with dynamic time windows.
POST /api/v1/schedule/create - (Instructor only) Calls Zoom S2S OAuth to schedule a new meeting and saves it to local DB.
Assignment & Submission Workspaces
GET /api/v1/assignments - Retrieves active assignments and submission feeds for the logged-in student.
POST /api/v1/assignments/:id/submit - Submits a student's GitHub repo link and custom notes for review.
GET /api/v1/assignments/:id/submissions - Retrieves peer submissions for an assignment. (Filters public work for students; returns all for instructors).
PUT /api/v1/submissions/:id/grade - (Instructor only) Assigns score, saves mentor feedback, and updates status to graded.
⚙️ Setup & Installation Instructions
Prerequisites
Install Node.js (LTS Version).
Install XAMPP and ensure Apache and MySQL services are running.
1. Database Migrations
Open your browser and navigate to http://localhost/phpmyadmin/.
Create a new database named live_portal.
Import the database.sql script into your database:
Using PowerShell (Recommended):
Get-Content database.sql | & "C:\xampp\mysql\bin\mysql.exe" -u root -p live_portal
(Press Enter when prompted for password, as XAMPP's default is blank).
2. Backend Environment Variables
Create a file named .env in the root directory and define the configuration:

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=live_portal
JWT_SECRET=super_secret_key_for_portal_tokens
3. Service Installations
Open your terminal and install dependencies for both servers:

# In the project root directory (Express API)
npm install

# Navigate to the frontend directory
cd client
npm install
🏁 Running the Application
The Automatic One-Click Launcher
We have created an automated launcher utility to start both systems in the background instantly!

📍 Where is the Launcher?
You will find the file run-project.bat directly in the main root directory of your project folder: C:\Users\Admin\live-learning-portal\run-project.bat

💻 How to use it:
Open your Windows File Explorer.
Navigate to your project directory: C:\Users\Admin\live-learning-portal.
Locate run-project.bat and double-click it.
This script will automatically:
Open a command window titled "Backend API" and run your backend on port 5000.
Pause for 2 seconds to verify the MySQL connection.
Open a second window titled "React Frontend" and launch your Vite development server on port 5173.
Open your browser to http://localhost:5173/ to log in and test!
Manual Startup (Alternative)
If you prefer running commands manually, open two terminal tabs in VS Code:

Tab 1 (Root folder): node server.js
Tab 2 (Client folder): cd client -> npm run dev
🔑 Test Credentials
Role	Email	Password
Student (Jane Student)	student@portal.com	studentpassword123
Instructor (Test Instructor)	instructor@portal.com	securepassword123
