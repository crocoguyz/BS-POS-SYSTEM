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

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData); // Login အောင်ရင် User Data သိမ်းပြီး Admin Panel ပြမယ်
  };

  return (
    <div className="App">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Admin user={user} />
      )}
    </div>
  );
}

export default App;