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
import Login from "./Login";
import Admin from "./Admin";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  // Login အောင်မြင်တဲ့အခါ User Info သိမ်းမယ်
  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Logout လုပ်တဲ့အခါ သုံးဖို့ (လိုအပ်ရင်)
  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="App">
      {!user ? (
        // User မရှိရင် Login Page ပြမယ်
        <Login onLogin={handleLogin} />
      ) : (
        // User ရှိရင် Admin Panel ပြမယ် (Logout handle လုပ်ဖို့ function ပါ ထည့်ပေးထားတယ်)
        <Admin user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;