import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Admin from "./Admin";
import Menu from "./Menu";
import Kitchen from "./Kitchen";
import { LanguageProvider } from "./LanguageContext";


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
   
    const actualUser = userData.user ? userData.user : userData;

    console.log("App.js received actualUser:", actualUser);
    
  if (actualUser && actualUser.role) {

    localStorage.setItem("user", JSON.stringify(actualUser));
    setUser(actualUser);
 const role = String(actualUser.role).toLowerCase();
      if (role === "cashier" || role === "admin" || role === "owner") {
        window.location.href = "/admin";
      } else if (role === "waiter") {
        window.location.href = "/menu";
      } else if (role === "kitchen") {
        window.location.href = "/kitchen";
      }
    } else {
      alert("Error: User Role ပါမလာပါ။ Login Logic ကို ပြန်စစ်ပါ");
    }
  };


  const handleLogout = async () => {
  try {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (savedUser?.name) {
      await fetch("https://bs-pos-system.onrender.com/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: savedUser.name })
      });
    }
  } catch (err) {
    console.error("Logout API error:", err);
  }

  localStorage.removeItem("user");
  setUser(null);
};

  if (loading) return <div>Loading...</div>;

  const getHome = () => {
    if (!user) return "/login";
    
    // 💡 စာလုံးအကြီးအသေး မမှားအောင် toLowerCase() သုံးပြီး စစ်တာ အကောင်းဆုံးပါ
    const role = user.role.toLowerCase();
    console.log("Current User Role:", role);

    if (role === "kitchen") return "/kitchen";
    if (role === "waiter") return "/menu";
    if (role === "cashier" || role === "admin" || role === "owner") return "/admin";
    
    return "/login";
  };

  const ProtectedRoute = ({ children, roles }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  // 1. User မရှိရင် login ကို ပြန်လွှတ်မယ်
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Role စစ်မယ် (roles array ထဲမှာ user.role ပါလား ကြည့်မယ်)
  const userRole = user.role ? user.role.toLowerCase() : "";
  const isAuthorized = roles.some(role => role.toLowerCase() === userRole);

  if (!isAuthorized) {
    // Role မကိုက်ရင် login ကို ပြန်ပို့မယ်
    return <Navigate to="/login" replace />;
  }

  return children;
};

  return (
     <LanguageProvider>
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
              <Menu user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kitchen"
          element={
            <ProtectedRoute roles={["kitchen"]}>
              <Kitchen user={user} onLogout={handleLogout} />
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
    </LanguageProvider>
  );
}


export default App;

