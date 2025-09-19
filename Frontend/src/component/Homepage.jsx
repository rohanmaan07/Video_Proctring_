import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#0b1220] text-white flex flex-col items-center justify-center px-4 sm:px-6 py-10">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          AI Video Proctoring System
        </h1>
        <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
          Welcome! This system uses advanced computer vision to monitor interviews in real-time, ensuring{" "}
          <span className="text-white font-semibold">integrity</span> and{" "}
          <span className="text-white font-semibold">fairness</span>. Choose your role below to proceed.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl justify-center">
        <Link
          to="/interview"
          className="group flex-1 max-w-sm rounded-3xl bg-[#071127] border border-gray-700 shadow-2xl p-8 hover:shadow-3xl hover:bg-[#0f172a] transition-all duration-300 backdrop-blur-md"
        >
          <h2 className="text-2xl font-bold mb-3 text-blue-400 group-hover:text-blue-300 transition-colors">
            For Candidates
          </h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Start your proctored interview session. Ensure you are in a quiet, well-lit room for best performance.
          </p>
          <button className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-200 transform group-hover:scale-105">
            Start a New Interview →
          </button>
        </Link>
        <Link
          to="/admin"
          className="group flex-1 max-w-sm rounded-3xl bg-[#071127] border border-gray-700 shadow-2xl p-8 hover:shadow-3xl hover:bg-[#0f172a] transition-all duration-300 backdrop-blur-md"
        >
          <h2 className="text-2xl font-bold mb-3 text-green-400 group-hover:text-green-300 transition-colors">
            For Admins
          </h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Access the dashboard to review completed interview sessions and analyze proctoring reports with full transparency.
          </p>
          <button className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-200 transform group-hover:scale-105">
            View Reports →
          </button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
