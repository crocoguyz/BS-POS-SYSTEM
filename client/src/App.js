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

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Admin from "./Admin";
import Menu from "./Menu";
import Kitchen from "./Kitchen";

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user"); // 🔥 IMPORTANT
    setUser(null);
  };

  // 🔥 Protected Route
  const ProtectedRoute = ({ children, roles }) => {
    if (!user) return <Navigate to="/login" />;

    if (!roles.includes(user.role)) {
      // role redirect logic
      if (user.role === "kitchen") return <Navigate to="/kitchen" />;
      if (user.role === "waiter") return <Navigate to="/menu" />;
      if (user.role === "kitchen") return <Navigate to="/kitchen" />;
      if (user.role === "waiter") return <Navigate to="/menu" />;
      return <Navigate to="/admin" />;
    }

    return children;
  };

  return (
    <Router>
      <Routes>

        {/* PUBLIC */}
        <Route path="/login" element={
          !user ? <Login onLogin={handleLogin} /> : <Navigate to="/admin" />
        } />

        <Route path="/menu" element={<Menu />} />
        <Route path="/kitchen" element={<Kitchen />} />

        {/* ADMIN PANEL */}
        <Route path="/admin" element={
          <ProtectedRoute roles={["admin", "cashier"]}>
            <Admin user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        } />

        {/* OPTIONAL EXTRA PAGES */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </Router>
  );
}

export default App;