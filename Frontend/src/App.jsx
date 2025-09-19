import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./component/Homepage";
import InterviewScreen from "./component/Interview";
import InterviewDetail from "./component/InterviewDetail";
import Admin from "./component/Admin";
import AdminLogin from "./component/AdminLogin";

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("isAdmin");
    if (stored === "true") setIsAdmin(true);
  }, []);

  return (
    <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900 min-h-screen font-sans">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/interview" element={<InterviewScreen />} />
        <Route
          path="/admin-login"
          element={<AdminLogin setIsAdmin={setIsAdmin} />}
        />
        <Route
          path="/admin"
          element={
            isAdmin ? (
              <Admin setIsAdmin={setIsAdmin} />
            ) : (
              <AdminLogin setIsAdmin={setIsAdmin} />
            )
          }
        />
        <Route path="/interview/:id" element={<InterviewDetail />} />
      </Routes>
    </div>
  );
};

export default App;
