import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Admin from "./Admin";
import Menu from "./Menu";
import Kitchen from "./Kitchen";

function App() {
 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 🔥 FIX 1

  // 🔥 restore session
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false); // 🔥 wait finish
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // 🔥 WAIT UNTIL LOAD FINISH
  if (loading) return <div>Loading...</div>;

  // 🔥 CENTRAL REDIRECT
  const getHome = () => {
    if (!user) return "/login";
    if (user.role === "kitchen") return "/kitchen";
    if (user.role === "waiter") return "/menu";
    if (user.role === "cashier") return "/admin";
    if (user.role === "admin") return "/admin";
return "/login";
  };

  const ProtectedRoute = ({ children, roles }) => {
    if (!user) return <Navigate to="/login" />;

    if (!roles.includes(user.role)) {
      return <Navigate to={getHome()} />;
    }

    return children;
  };
  

  return (
    <Router>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            !user ? (
              <Login onLogin={handleLogin} />
            ) : (
              <Navigate to={getHome()} />
            )
          }
        />

        {/* MENU */}
        <Route
  path="/menu"
  element={
    <ProtectedRoute roles={["waiter"]}>
      <Menu onLogout={handleLogout} />
    </ProtectedRoute>
  }
/>

<Route
  path="/kitchen"
  element={
    <ProtectedRoute roles={["kitchen"]}>
      <Kitchen onLogout={handleLogout} />
    </ProtectedRoute>
  }
/>

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin", "cashier"]}>
              <Admin user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* ROOT */}
        <Route path="/" element={<Navigate to={getHome()} />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to={getHome()} />} />

      </Routes>
    </Router>
  );
  
}

export default App;