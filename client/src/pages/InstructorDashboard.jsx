import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Video, BookOpen, Clock, LogOut, Award } from 'lucide-react';

// Single logo import
import logo from '../assets/logo.png';

// Dynamic API Base URL pointing to Render live backend
const API_BASE = import.meta.env.VITE_API_URL || 'https://live-learning-portal.onrender.com';

export default function InstructorDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [userName, setUserName] = useState('');

  // New Class Form State
  const [classTitle, setClassTitle] = useState('');
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

    if (!token || (role !== 'instructor' && role !== 'super_admin')) {
      localStorage.clear();
      navigate('/');
      return;
    }

    setUserName(name || 'Instructor');
    fetchDashboardData(token);
  }, [navigate]);

  // Fetch Submissions & Attendance Logs
  const fetchDashboardData = async (token) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch student submissions for grading
      const submissionRes = await axios.get(`${API_BASE}/api/v1/assignments/1/submissions`, config);
      setSubmissions(submissionRes.data || []);

      // Simulating live attendance logs
      setAttendance([
        { id: 1, name: 'Jane Student', email: 'student@portal.com', session: 'Intro to Node.js & MySQL', duration: '45 mins', status: 'Present' }
      ]);
    } catch (err) {
      console.error("Error loading instructor data:", err);
    }
  };

  // 1. Create Live Zoom Session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    setClassError('');
    setClassSuccess('');
    const token = localStorage.getItem('token');

    try {
      await axios.post(`${API_BASE}/api/v1/schedule/create`, {
        title: classTitle,
        description: classDesc,
        start_time: classTime,
        duration_minutes: parseInt(classDuration)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setClassSuccess('Live Zoom session successfully created and synced!');
      setClassTitle('');
      setClassDesc('');
      setClassTime('');
      setClassDuration(60);
      fetchDashboardData(token);
    } catch (err) {
      setClassError(err.response?.data?.error || 'Failed to create session.');
    }
  };

  // 2. Post New Homework Set Prompt
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

      setAssignSuccess('Assignment prompt successfully posted!');
      setAssignTitle('');
      setAssignInstructions('');
      setAssignDueDate('');
      setAssignMaxScore(100);
      fetchDashboardData(token);
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Failed to post assignment.');
    }
  };

  // 3. Submit Student Grade
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
            <img 
              src={logo} 
              alt="Portal Logo" 
              className="h-10 w-auto object-contain" 
            />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-blue-900 tracking-wide">Instructor Console</h1>
            <p className="text-xs text-blue-600 font-medium">Logged in as: {userName}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center text-blue-700 hover:text-red-600 bg-blue-50 hover:bg-red-50 px-3.5 py-1.5 rounded-lg font-semibold text-sm gap-2 transition border border-blue-100"
        >
          <LogOut size={16} /> Logout
        </button>
      </nav>

      {/* MAIN CONTENT WORKSTATION GRID */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        
        {/* CARD 1: CREATE LIVE ZOOM SESSION */}
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
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white text-gray-900"
                placeholder="e.g. Advancing React State Management"
                value={classTitle}
                onChange={(e) => setClassTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Description</label>
              <textarea
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white text-gray-900"
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
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white text-gray-900"
                  value={classTime}
                  onChange={(e) => setClassTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Duration (Mins)</label>
                <input
                  type="number"
                  required
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white text-gray-900"
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

        {/* CARD 2: HOMEWORK GRADING WORKSTATION */}
        <div className="bg-white/90 backdrop-blur-sm text-gray-900 p-6 rounded-2xl shadow-md border border-blue-100">
          <h2 className="text-xl font-bold text-blue-950 mb-4 flex items-center gap-2">
            <Award className="text-blue-600" size={22} /> Homework Grading Workstation
          </h2>

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

        {/* CARD 3: POST NEW HOMEWORK SET */}
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
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white text-gray-900"
                placeholder="e.g. Build a MySQL CRUD API"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Instructions</label>
              <textarea
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white text-gray-900"
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
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white text-gray-900"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Max Score</label>
                <input
                  type="number"
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white text-gray-900"
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

        {/* CARD 4: ATTENDANCE LOGS */}
        <div className="bg-white/90 backdrop-blur-sm text-gray-900 p-6 rounded-2xl shadow-md border border-blue-100">
          <h2 className="text-xl font-bold text-blue-950 mb-4 flex items-center gap-2">
            <Clock className="text-blue-600" size={22} /> Dynamic Live Session Attendance Logs
          </h2>

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
                    <td className="p-2.5 font-bold text-gray-900">{log.name}</td>
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