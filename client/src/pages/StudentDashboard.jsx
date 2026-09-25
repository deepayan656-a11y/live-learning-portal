import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Video, BookOpen, Clock, LogOut, Send, X, ExternalLink, Users, Award } from 'lucide-react';

// 1. Single logo import
import logo from '../assets/logo.png';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
<div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 mb-6 flex items-center justify-between col-span-full">
  <div className="flex items-center gap-4">
    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md">
      {(localStorage.getItem('userName') || 'S').charAt(0).toUpperCase()}
    </div>
    <div>
      <h2 className="text-xl font-bold text-gray-900">{localStorage.getItem('userName') || 'Student'}</h2>
      <p className="text-xs text-gray-500 mt-0.5">{localStorage.getItem('userEmail') || 'Registered Profile'}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 capitalize">
          Role: {localStorage.getItem('role') || 'student'}
        </span>
        <span className="text-xs text-emerald-600 font-medium">● Active Workspace</span>
      </div>
    </div>
  </div>
</div>
export default function StudentDashboard() {
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [publicPeerSubmissions, setPublicPeerSubmissions] = useState([]);
  const [selectedAssignmentForGallery, setSelectedAssignmentForGallery] = useState(null);
  const [userName, setUserName] = useState('');

  // Modal & Submission states
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [externalLink, setExternalLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Gallery view state
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');
    if (name) setUserName(name);

    if (token) {
      fetchDashboardData(token);
    }
  }, []);

  const fetchDashboardData = async (token) => {
    try {
      const [scheduleRes, assignmentRes] = await Promise.all([
        axios.get('http://localhost:5000/api/v1/schedule/upcoming', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/v1/assignments', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUpcomingClasses(scheduleRes.data || []);
      setAssignments(assignmentRes.data || []);
    } catch (err) {
      console.error("Error loading student dashboard data:", err);
    }
  };

  const handleOpenPeerGallery = async (assignment) => {
    const token = localStorage.getItem('token');
    setSelectedAssignmentForGallery(assignment);
    setShowGalleryModal(true);

    try {
      const res = await axios.get(`http://localhost:5000/api/v1/assignments/${assignment.assignment_id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const publicSubmissions = (res.data || []).filter(sub => sub.is_public_to_peers);
      setPublicPeerSubmissions(publicSubmissions);
    } catch (err) {
      console.error("Error loading peer gallery:", err);
      setPublicPeerSubmissions([]);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitting(true);

    const token = localStorage.getItem('token');

    try {
      await axios.post(
        `http://localhost:5000/api/v1/assignments/${activeAssignment.assignment_id}/submit`,
        {
          external_link: externalLink,
          submission_notes: submissionNotes
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSubmitSuccess('Your assignment has been submitted successfully!');
      setExternalLink('');
      setSubmissionNotes('');
      await fetchDashboardData(token);

      setTimeout(() => {
        setActiveAssignment(null);
        setSubmitSuccess('');
      }, 1500);

    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSessionButtonStatus = (startTimeStr, durationMinutes) => {
    const now = new Date();
    const startTime = new Date(startTimeStr);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
    const tenMinsBeforeStart = new Date(startTime.getTime() - 10 * 60000);

    if (now < tenMinsBeforeStart) {
      return { label: 'Starts Soon', active: false };
    } else if (now >= tenMinsBeforeStart && now <= endTime) {
      return { label: 'Join Class Now', active: true };
    } else {
      return { label: 'Session Ended', active: false };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar with Logo */}
      <nav className="bg-white shadow-sm border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src={logo} 
            alt="Portal Logo" 
            className="h-10 w-auto object-contain" 
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
            <p className="text-sm text-gray-500">Welcome back, {userName}!</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center text-gray-600 hover:text-red-600 font-medium text-sm gap-2 transition"
        >
          <LogOut size={16} /> Logout
        </button>
      </nav>

      {/* Main Dashboard Layout */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Scheduled Live Classes */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Video className="text-indigo-600" size={22} /> Scheduled Live Classes
          </h2>

          {upcomingClasses.length === 0 ? (
            <p className="text-sm text-gray-500">No live sessions scheduled at the moment.</p>
          ) : (
            <div className="space-y-4">
              {upcomingClasses.map((session) => {
                const status = getSessionButtonStatus(session.start_time, session.duration_minutes);
                return (
                  <div key={session.session_id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{session.title}</h3>
                      <p className="text-xs text-gray-500">{session.description}</p>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Clock size={12} /> {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {session.duration_minutes} mins
                      </p>
                    </div>

                    {status.active ? (
                      <a
                        href={session.zoom_join_url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition"
                      >
                        {status.label}
                      </a>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-md font-medium">
                        {status.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Assignment Hub */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={22} /> Assignment Hub
          </h2>

          {assignments.length === 0 ? (
            <p className="text-sm text-gray-500">No active assignments posted.</p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.assignment_id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{assignment.title}</h3>
                      <p className="text-xs text-gray-500">{assignment.instructions}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700">
                      {assignment.status || 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 text-xs pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleOpenPeerGallery(assignment)}
                      className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                    >
                      <Users size={14} /> Gallery
                    </button>
                    <button
                      onClick={() => setActiveAssignment(assignment)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Open Workspace →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Assignment Workspace Modal */}
      {activeAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => { setActiveAssignment(null); setSubmitSuccess(''); setSubmitError(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900">Assignment Workspace</h3>
            <p className="text-xs text-gray-500 mb-4">Submitting for: {activeAssignment.title}</p>

            {submitSuccess && (
              <div className="mb-4 text-xs p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
                {submitSuccess}
              </div>
            )}
            {submitError && (
              <div className="mb-4 text-xs p-3 rounded-lg bg-red-50 text-red-600 border border-red-200">
                {submitError}
              </div>
            )}

            <form onSubmit={handleAssignmentSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">Project Repository Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/username/project"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Submission Notes</label>
                <textarea
                  rows="3"
                  placeholder="Brief notes for your mentor..."
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAssignment(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Peer Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <button 
              onClick={() => setShowGalleryModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Award className="text-amber-500" size={20} /> Exemplary Peer Submissions
            </h3>
            <p className="text-xs text-gray-500 mb-4">{selectedAssignmentForGallery?.title}</p>

            {publicPeerSubmissions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No featured peer submissions yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {publicPeerSubmissions.map((sub, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-800">Featured Student Project</span>
                      {sub.external_link && (
                        <a 
                          href={sub.external_link} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                        >
                          View Code <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 italic">"{sub.submission_notes || 'Great execution!'}"</p>
                    {sub.instructor_feedback && (
                      <p className="text-xs text-green-700 font-medium mt-2 bg-green-50 p-2 rounded">
                        Mentor Feedback: {sub.instructor_feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}