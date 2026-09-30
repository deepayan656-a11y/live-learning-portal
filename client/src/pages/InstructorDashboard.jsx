import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Video, BookOpen, Clock, LogOut, Award, Download, FileSpreadsheet } from 'lucide-react';
import logo from '../assets/logo.png';

const API_BASE = import.meta.env.VITE_API_URL || 'https://live-learning-portal.onrender.com';

// Course List extracted directly from names.jpeg
const courseList = [
  "FULL STACK",
  "Artificial Intelligence",
  "DATA SCIENCE",
  "DATA ANALYTICS",
  "CYBER SECURITY",
  "BUSINESS ANALYTICS",
  "CLOUD COMPUTING",
  "DSA",
  "UI/UX",
  "Machine Learning",
  "DIGITAL MARKETING",
  "EMBEDDED SYSTEMS",
  "GEN AI",
  "VLSI",
  "POWER BI",
  "AUTO CAD",
  "DEEP LEARNING",
  "NLP",
  "PSYCHOLOGY",
  "CATIA",
  "DRONE TECHNOLOGY",
  "SOFTWARE TESTING",
  "NETWORKING",
  "SYSTEM ADMINISTRATION",
  "CYBER SECURITY ADVANCE",
  "BIM",
  "REVIT",
  "STAD PRO",
  "PCB",
  "ROBOTICS",
  "COMPUTER VISION",
  "SOFTWARE DEVELOPMENT",
  "DEVOPS",
  "DBMS",
  "BLOCK CHAIN",
  "SOLID WORKS",
  "MEDICAL CODING",
  "SALES & MARKETING",
  "FINANCE",
  "HR MANAGEMENT"
];

export default function InstructorDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [userName, setUserName] = useState('');

  // New Class Form State
  const [classTitle, setClassTitle] = useState('');
  const [targetCourse, setTargetCourse] = useState(courseList);
  const [classDesc, setClassDesc] = useState('');
  const [classTime, setClassTime] = useState('');
  const [classDuration, setClassDuration] = useState(60);
  const [classError, setClassError] = useState('');
  const [classSuccess, setClassSuccess] = useState('');

  // New Assignment Form State
  const [assignTitle, setAssignTitle] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignMaxScore, setAssignMaxScore] = useState(100);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  // Grading State
  const [activeGradingId, setActiveGradingId] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradeError, setGradeError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('userName');

    if (!token || (role !== 'instructor' && role !== 'admin' && role !== 'super_admin')) {
      localStorage.clear();
      navigate('/');
      return;
    }

    setUserName(name || 'Instructor / Admin');
    fetchDashboardData(token);
  }, [navigate]);

  const fetchDashboardData = async (token) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const submissionRes = await axios.get(`${API_BASE}/api/v1/assignments/1/submissions`, config);
      setSubmissions(submissionRes.data || []);

      // Live attendance logs
      setAttendance([
        { id: 1, name: 'Jane Student', email: 'student@portal.com', session: 'Intro to Node.js & MySQL', duration: '45 mins', status: 'Present' }
      ]);
    } catch (err) {
      console.error("Error loading instructor data:", err);
    }
  };

  // ==========================================
  // 1-CLICK EXPORT FUNCTIONS FOR GOOGLE SHEETS / EXCEL
  // ==========================================

  // Export Attendance Logs to CSV
  const handleExportAttendanceCSV = () => {
    if (!attendance || attendance.length === 0) {
      alert("No attendance data available to export.");
      return;
    }

    const headers = ["ID", "Student Name", "Email Address", "Session Title", "Calculated Time", "Attendance Status"];
    const rows = attendance.map(item => [
      item.id || '',
      `"${(item.name || '').replace(/"/g, '""')}"`,
      item.email || '',
      `"${(item.session || '').replace(/"/g, '""')}"`,
      `"${(item.duration || '').replace(/"/g, '""')}"`,
      item.status || 'Present'
    ]);

    const csvContent = ["\ufeff" + headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Assignment Submissions to CSV
  const handleExportSubmissionsCSV = () => {
    if (!submissions || submissions.length === 0) {
      alert("No submission records available to export.");
      return;
    }

    const headers = ["Submission ID", "Student ID", "Project Repository Link", "Submission Notes", "Status", "Grade Score", "Instructor Feedback"];
    const rows = submissions.map(sub => [
      sub.submission_id || sub.id || '',
      sub.student_id || '',
      `"${(sub.external_link || '').replace(/"/g, '""')}"`,
      `"${(sub.submission_notes || '').replace(/"/g, '""')}"`,
      sub.status || 'Submitted',
      sub.grade_score !== undefined && sub.grade_score !== null ? sub.grade_score : 'Not Graded',
      `"${(sub.instructor_feedback || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = ["\ufeff" + headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Student_Submissions_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create Live Zoom Session with Selected Course
  const handleCreateSession = async (e) => {
    e.preventDefault();
    setClassError('');
    setClassSuccess('');
    const token = localStorage.getItem('token');

    try {
      await axios.post(`${API_BASE}/api/v1/schedule/create`, {
        title: classTitle,
        course_name: targetCourse, // Direct course mapping
        description: classDesc,
        start_time: classTime,
        duration_minutes: parseInt(classDuration)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setClassSuccess(`Live Zoom session scheduled for ${targetCourse}!`);
      setClassTitle('');
      setClassDesc('');
      setClassTime('');
      setClassDuration(60);
      fetchDashboardData(token);
    } catch (err) {
      setClassError(err.response?.data?.error || 'Failed to create session.');
    }
  };

  // Post New Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');
    const token = localStorage.getItem('token');

    try {
      await axios.post(`${API_BASE}/api/v1/assignments`, {
        title: assignTitle,
        instructions: assignInstructions,
        due_date: assignDueDate,
        max_score: parseInt(assignMaxScore)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAssignSuccess('Assignment prompt posted successfully!');
      setAssignTitle('');
      setAssignInstructions('');
      setAssignDueDate('');
      setAssignMaxScore(100);
      fetchDashboardData(token);
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Failed to post assignment.');
    }
  };

  // Submit Grade
  const handleGradeSubmission = async (submissionId) => {
    setGradeError('');
    const token = localStorage.getItem('token');

    try {
      await axios.put(`${API_BASE}/api/v1/assignments/submissions/${submissionId}/grade`, {
        grade_score: parseInt(gradeScore),
        instructor_feedback: gradeFeedback
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActiveGradingId(null);
      setGradeScore('');
      setGradeFeedback('');
      fetchDashboardData(token);
    } catch (err) {
      setGradeError('Error saving grade.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 text-gray-900 flex flex-col">
      {/* NAVBAR */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b border-blue-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-blue-100 flex items-center justify-center">
            <img src={logo} alt="Portal Logo" className="h-10 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-blue-900 tracking-wide">Instructor Console</h1>
            <p className="text-xs text-blue-600 font-medium">Logged in as: {userName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 1-CLICK CSV EXPORT BUTTON */}
          <button
            onClick={handleExportAttendanceCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition"
          >
            <FileSpreadsheet size={15} /> Export Attendance (.CSV)
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center text-blue-700 hover:text-red-600 bg-blue-50 hover:bg-red-50 px-3.5 py-1.5 rounded-lg font-semibold text-sm gap-2 transition border border-blue-100"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT GRID */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

        {/* CARD 1: CREATE LIVE ZOOM SESSION WITH COURSE DROPDOWN */}
        <div className="bg-white/90 backdrop-blur-sm text-gray-900 p-6 rounded-2xl shadow-md border border-blue-100">
          <h2 className="text-xl font-bold text-blue-950 mb-4 flex items-center gap-2">
            <Video className="text-blue-600" size={22} /> Create Live Zoom Session
          </h2>

          {classSuccess && (
            <div className="mb-4 text-xs p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 font-medium">
              {classSuccess}
            </div>
          )}
          {classError && (
            <div className="mb-4 text-xs p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 font-medium">
              {classError}
            </div>
          )}

          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700">Session Title</label>
              <input
                type="text"
                required
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900"
                placeholder="e.g. Advanced State Management"
                value={classTitle}
                onChange={(e) => setClassTitle(e.target.value)}
              />
            </div>

            {/* Target Course Dropdown */}
            <div>
              <label className="text-xs font-semibold text-gray-700">Target Course / Domain</label>
              <select
                value={targetCourse}
                onChange={(e) => setTargetCourse(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900 font-medium"
              >
                {courseList.map((course, idx) => (
                  <option key={idx} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Description</label>
              <textarea
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900"
                rows="3"
                placeholder="Class notes..."
                value={classDesc}
                onChange={(e) => setClassDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900"
                  value={classTime}
                  onChange={(e) => setClassTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Duration (Mins)</label>
                <input
                  type="number"
                  required
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900"
                  value={classDuration}
                  onChange={(e) => setClassDuration(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm transition"
            >
              Schedule & Sync to Zoom
            </button>
          </form>
        </div>

        {/* CARD 2: GRADING WORKSTATION */}
        <div className="bg-white/90 backdrop-blur-sm text-gray-900 p-6 rounded-2xl shadow-md border border-blue-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
              <Award className="text-blue-600" size={22} /> Homework Grading Workstation
            </h2>
            <button
              onClick={handleExportSubmissionsCSV}
              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-xs border border-blue-200 flex items-center gap-1 transition"
            >
              <Download size={13} /> Export Submissions (.CSV)
            </button>
          </div>

          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No pending student submissions to evaluate.</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div key={sub.submission_id || sub.id} className="border border-blue-100 rounded-xl p-4 bg-blue-50/30 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">Student ID: {sub.student_id}</h3>
                      {sub.external_link && (
                        <a href={sub.external_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-semibold">
                          View Project Repository ↗
                        </a>
                      )}
                      <p className="text-xs text-gray-500 italic mt-1">"{sub.submission_notes}"</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700 capitalize">
                      {sub.status || 'Submitted'}
                    </span>
                  </div>

                  {activeGradingId === (sub.submission_id || sub.id) ? (
                    <div className="space-y-3 pt-2 border-t border-gray-200">
                      {gradeError && <p className="text-xs text-red-600">{gradeError}</p>}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Score / 100"
                          className="px-3 py-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900"
                          value={gradeScore}
                          onChange={(e) => setGradeScore(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Feedback notes..."
                          className="px-3 py-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900"
                          value={gradeFeedback}
                          onChange={(e) => setGradeFeedback(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setActiveGradingId(null)}
                          className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleGradeSubmission(sub.submission_id || sub.id)}
                          className="px-3 py-1 text-xs text-white bg-blue-600 rounded font-semibold"
                        >
                          Submit Marks
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-2 border-t border-blue-100">
                      <button
                        onClick={() => setActiveGradingId(sub.submission_id || sub.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                      >
                        Grade Assignment →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CARD 3: POST NEW ASSIGNMENT */}
        <div className="bg-white/90 backdrop-blur-sm text-gray-900 p-6 rounded-2xl shadow-md border border-blue-100">
          <h2 className="text-xl font-bold text-blue-950 mb-4 flex items-center gap-2">
            <BookOpen className="text-blue-600" size={22} /> Post New Homework Set
          </h2>

          {assignSuccess && (
            <div className="mb-4 text-xs p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 font-medium">
              {assignSuccess}
            </div>
          )}
          {assignError && (
            <div className="mb-4 text-xs p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 font-medium">
              {assignError}
            </div>
          )}

          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700">Assignment Title</label>
              <input
                type="text"
                required
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900"
                placeholder="e.g. Build a MySQL CRUD API"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Instructions</label>
              <textarea
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900"
                rows="3"
                placeholder="Describe the homework details..."
                value={assignInstructions}
                onChange={(e) => setAssignInstructions(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">Due Date</label>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Max Score</label>
                <input
                  type="number"
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900"
                  value={assignMaxScore}
                  onChange={(e) => setAssignMaxScore(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm shadow-sm transition"
            >
              Post Assignment Prompt
            </button>
          </form>
        </div>

        {/* CARD 4: ATTENDANCE LOGS WITH CSV EXPORT */}
        <div className="bg-white/90 backdrop-blur-sm text-gray-900 p-6 rounded-2xl shadow-md border border-blue-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
              <Clock className="text-blue-600" size={22} /> Dynamic Attendance Logs
            </h2>
            <button
              onClick={handleExportAttendanceCSV}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center gap-1.5"
            >
              📊 Export to CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-blue-50 text-blue-900 font-bold uppercase border-b border-blue-100">
                <tr>
                  <th className="p-2.5">Student Name</th>
                  <th className="p-2.5">Session Title</th>
                  <th className="p-2.5">Calculated Time</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendance.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/40">
                    <td className="p-2.5 font-bold text-gray-900">
                      {log.name} <br />
                      <span className="text-[10px] text-gray-400 font-normal">{log.email}</span>
                    </td>
                    <td className="p-2.5 text-gray-600">{log.session}</td>
                    <td className="p-2.5 text-blue-700 font-bold">{log.duration}</td>
                    <td className="p-2.5 text-green-700 font-extrabold">{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}