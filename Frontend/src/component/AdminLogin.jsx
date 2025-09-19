import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = ({ setIsAdmin }) => {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const adminPassword = "admin123";

  const handleLogin = () => {
    if (password === adminPassword) {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true'); 
      navigate('/admin');
    } else {
      alert('Incorrect Password!');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
      <div className="w-full max-w-md bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-700">
        <h1 className="text-4xl font-bold text-white text-center mb-6">Admin Login</h1>
        <p className="text-gray-400 text-center mb-8">Enter your admin password to continue</p>
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 rounded-xl bg-[#071127] border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
        />
        <button
          onClick={handleLogin}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
