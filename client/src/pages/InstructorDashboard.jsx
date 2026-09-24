import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Video, BookOpen, Clock, LogOut, Award, Plus, Calendar, FileText } from 'lucide-react';

// 1. Single logo import
import logo from '../assets/logo.png';

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
  }, []);

  const fetchDashboardData = async (token) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch all submissions for grading
      const submissionRes = await axios.get('http://localhost:5000/api/v1/assignments/1/submissions', config);
      setSubmissions(submissionRes.data || []);

      // Simulating live attendance logs
      setAttendance([
        { id: 1, name: 'Jane Student', email: 'student@portal.com', session: 'Intro to Node.js & MySQL', duration: '45 mins', status: 'Present' }
      ]);
    } catch (err) {
      console.error("Error loading instructor data:", err);
    }
  };

  // 1. Handle Creating a Live Zoom Session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    setClassError('');
    setClassSuccess('');
    const token = localStorage.getItem('token');

    try {
      await axios.post('http://localhost:5000/api/v1/schedule/create', {
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

  // 2. Handle Posting a New Assignment Prompt
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');
    const token = localStorage.getItem('token');

    try {
      await axios.post('http://localhost:5000/api/v1/assignments', {
        title: assignTitle,
        instructions: assignInstructions,
        due_date: assignDueDate,
        max_score: parseInt(assignMaxScore)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAssignSuccess('Assignment prompt successfully posted to Student Workspace!');
      setAssignTitle('');
      setAssignInstructions('');
      setAssignDueDate('');
      setAssignMaxScore(100);
      fetchDashboardData(token);
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Failed to post assignment.');
    }
  };

  // 3. Handle Submitting a Grade
  const handleGradeSubmission = async (submissionId) => {
    setGradeError('');
    const token = localStorage.getItem('token');

    try {
      await axios.put(`http://localhost:5000/api/v1/submissions/${submissionId}/grade`, {
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
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Navbar with Logo */}
      <nav className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src={logo} 
            alt="Portal Logo" 
            className="h-10 w-auto object-contain bg-white/10 p-1 rounded-lg" 
          />
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Instructor Console</h1>
            <p className="text-xs text-gray-400">Logged in as: {userName}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center text-gray-300 hover:text-red-400 font-medium text-sm gap-2 transition"
        >
          <LogOut size={16} /> Logout
        </button>
      </nav>

      {/* Main Workstation Grid */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Card 1: Create Live Zoom Session */}
        <div className="bg-white text-gray-900 p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Video className="text-indigo-600" size={22} /> Create Live Zoom Session
          </h2>

          {classSuccess && (
            <div className="mb-4 text-xs p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
              {classSuccess}
            </div>
          )}
          {classError && (
            <div className="mb-4 text-xs p-3 rounded-lg bg-red-50 text-red-600 border border-red-200">
              {classError}
            </div>
          )}

          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700">Session Title</label>
              <input
                type="text"
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="e.g. Advancing React State Management"
                value={classTitle}
                onChange={(e) => setClassTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Description</label>
              <textarea
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
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
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  value={classTime}
                  onChange={(e) => setClassTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Duration (Mins)</label>
                <input
                  type="number"
                  required
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  value={classDuration}
                  onChange={(e) => setClassDuration(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition"
            >
              Schedule & Sync to Zoom
            </button>
          </form>
        </div>

        {/* Card 2: Homework Grading Workstation */}
        <div className="bg-white text-gray-900 p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="text-indigo-600" size={22} /> Homework Grading Workstation
          </h2>

          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500">No pending student submissions to evaluate.</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div key={sub.submission_id || sub.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">Student ID: {sub.student_id}</h3>
                      {sub.external_link && (
                        <a href={sub.external_link} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline font-semibold">
                          View Project Repository
                        </a>
                      )}
                      <p className="text-xs text-gray-500 italic mt-1">"{sub.submission_notes}"</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700">
                      {sub.status || 'Submitted'}
                    </span>
                  </div>

                  {activeGradingId === (sub.submission_id || sub.id) ? (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      {gradeError && <p className="text-xs text-red-600">{gradeError}</p>}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Score / 100"
                          className="px-3 py-1.5 border border-gray-300 rounded text-xs"
                          value={gradeScore}
                          onChange={(e) => setGradeScore(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Feedback notes..."
                          className="px-3 py-1.5 border border-gray-300 rounded text-xs"
                          value={gradeFeedback}
                          onChange={(e) => setGradeFeedback(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setActiveGradingId(null)}
                          className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleGradeSubmission(sub.submission_id || sub.id)}
                          className="px-3 py-1 text-xs text-white bg-indigo-600 rounded font-semibold"
                        >
                          Submit Marks
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setActiveGradingId(sub.submission_id || sub.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Grade Assignment
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: Post New Homework Set */}
        <div className="bg-white text-gray-900 p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={22} /> Post New Homework Set
          </h2>

          {assignSuccess && (
            <div className="mb-4 text-xs p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
              {assignSuccess}
            </div>
          )}
          {assignError && (
            <div className="mb-4 text-xs p-3 rounded-lg bg-red-50 text-red-600 border border-red-200">
              {assignError}
            </div>
          )}

          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700">Assignment Title</label>
              <input
                type="text"
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="e.g. Build a MySQL CRUD API"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Instructions</label>
              <textarea
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
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
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Max Score</label>
                <input
                  type="number"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  value={assignMaxScore}
                  onChange={(e) => setAssignMaxScore(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-sm transition"
            >
              Post Assignment Prompt
            </button>
          </form>
        </div>

        {/* Card 4: Dynamic Live Session Attendance Logs */}
        <div className="bg-white text-gray-900 p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="text-indigo-600" size={22} /> Dynamic Live Session Attendance Logs
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-2">Student Name</th>
                  <th className="p-2">Session Title</th>
                  <th className="p-2">Calculated Time</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-2 font-medium">{log.name}</td>
                    <td className="p-2 text-gray-600">{log.session}</td>
                    <td className="p-2 text-indigo-600 font-semibold">{log.duration}</td>
                    <td className="p-2 text-green-600 font-bold">{log.status}</td>
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