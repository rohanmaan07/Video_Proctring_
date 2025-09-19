import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Calendar, User, LogOut, Trash2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../util/axios"; 

const Admin = ({ setIsAdmin }) => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await api.get("/api/interviews"); 
        setInterviews(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch interviews");
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    setIsAdmin(false);
    navigate("/"); 
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this interview?")) return;
    try {
      await api.delete(`/api/interview/${id}`);
      setInterviews(prev => prev.filter(i => i._id !== id));
      toast.success("Interview deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete interview!");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
          <p className="text-gray-300 text-lg">Loading interviews...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-8">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <header className="max-w-5xl mx-auto text-center mb-10 relative">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-gray-400 mt-2">
          Manage and review all scheduled interviews easily
        </p>
        <button
          onClick={handleLogout}
          className="absolute top-0 right-0 mt-4 mr-4 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white shadow-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </header>
      <div className="max-w-5xl mx-auto bg-[#071127] border border-gray-700 shadow-2xl rounded-2xl p-6 backdrop-blur-md">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-blue-400">
          <Calendar className="w-6 h-6" /> All Interviews
        </h2>

        {interviews.length === 0 ? (
          <p className="text-gray-400 text-center py-10">
            No interviews scheduled yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-700">
            {interviews.map((interview) => (
              <li
                key={interview._id}
                className="py-4 px-4 rounded-lg hover:bg-[#0f172a]/50 transition-all duration-300 flex justify-between items-center"
              >
                <Link
                  to={`/interview/${interview._id}`}
                  className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 group"
                >
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-lg text-gray-200 group-hover:text-blue-400 transition-colors">
                      <User className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                      {interview.candidateName}
                    </p>
                    <p className="text-sm text-gray-400">
                      Started on: {new Date(interview.startTime).toLocaleString()}
                    </p>
                  </div>
                  <span className="inline-block bg-blue-500/20 text-blue-400 text-sm px-4 py-1 rounded-full font-medium group-hover:bg-blue-500/40 transition">
                    View Details →
                  </span>
                </Link>
                <button
                  onClick={() => handleDelete(interview._id)}
                  className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Admin;
