// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Menu from "./Menu";
// import Kitchen from "./Kitchen";
// import Admin from "./Admin"; // အခုနက ဆောက်ထားတဲ့ Admin.js

// function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* စားသုံးသူတွေအတွက် Menu Page */}
//         <Route path="/" element={<Menu />} />
        
//         {/* မီးဖိုချောင်အတွက် Kitchen Page */}
//         <Route path="/kitchen" element={<Kitchen />} />
        
//         {/* Admin/Cashier အတွက် Admin Page */}
//         <Route path="/admin" element={<Admin />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Admin from "./Admin";
import Menu from "./Menu";
import Kitchen from "./Kitchen";

function App() {
  const [user, setUser] = useState(null);

  // 🔥 LOAD USER AFTER REFRESH
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // 🔥 PROTECTED ROUTE
  const ProtectedRoute = ({ children, roles }) => {
    if (!user) return <Navigate to="/login" />;

    if (!roles.includes(user.role)) {
      if (user.role === "kitchen") return <Navigate to="/kitchen" />;
      if (user.role === "waiter") return <Navigate to="/menu" />;
      return <Navigate to="/admin" />;
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
              <Navigate to={
                user.role === "kitchen"
                  ? "/kitchen"
                  : user.role === "waiter"
                  ? "/menu"
                  : "/admin"
              } />
            )
          }
        />

        {/* MENU (waiter only) */}
        <Route
          path="/menu"
          element={
            <ProtectedRoute roles={["waiter"]}>
              <Menu />
            </ProtectedRoute>
          }
        />

        {/* KITCHEN */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute roles={["kitchen"]}>
              <Kitchen />
            </ProtectedRoute>
          }
        />

        {/* ADMIN PANEL */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin", "cashier"]}>
              <Admin user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* DEFAULT */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </Router>
  );
}

export default App;