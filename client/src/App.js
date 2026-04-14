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
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route 
            path="/login" 
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/admin" />} 
          />
          <Route 
            path="/admin" 
            element={user ? <Admin user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;