import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Admin from "./Admin";
import Menu from "./Menu";
import Kitchen from "./Kitchen";

// ... (imports တွေက အတူတူပဲ)

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    // 💡 အရေးကြီး: userData က { success: true, user: { name, role } } လား
    // ဒါမှမဟုတ် { name, role } တိုက်ရိုက်လားဆိုတာ သေချာအောင် စစ်ပါ
    const actualUser = userData.user ? userData.user : userData;
    
    localStorage.setItem("user", JSON.stringify(actualUser));
    setUser(actualUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  const getHome = () => {
    if (!user) return "/login";
    
    // 💡 စာလုံးအကြီးအသေး မမှားအောင် toLowerCase() သုံးပြီး စစ်တာ အကောင်းဆုံးပါ
    const role = user.role.toLowerCase();

    if (role === "kitchen") return "/kitchen";
    if (role === "waiter") return "/menu";
    if (role === "cashier" || role === "admin" || role === "owner") return "/admin";
    
    return "/login";
  };

  const ProtectedRoute = ({ children, roles }) => {
    if (!user) return <Navigate to="/login" />;

    // 💡 Role စစ်တဲ့အခါမှာလည်း lowercase နဲ့ စစ်မယ်
    const userRole = user.role.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return <Navigate to={getHome()} />;
    }

    return children;
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={getHome()} />}
        />

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

        <Route
          path="/admin"
          element={
            // 💡 "owner" role ကိုပါ ထည့်ပေးထားမှ posadmin ဝင်လို့ရမှာပါ
            <ProtectedRoute roles={["admin", "cashier", "owner"]}>
              <Admin user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to={getHome()} />} />
        <Route path="*" element={<Navigate to={getHome()} />} />
      </Routes>
    </Router>
  );
}

export default App;
