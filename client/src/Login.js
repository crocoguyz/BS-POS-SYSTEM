import React, { useState } from "react";
import { Lock, User, LogIn } from "lucide-react";
import axios from "axios"; // axios ကို သုံးမယ်
import "./login.css";
 

export default function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/login", credentials);
      
      console.log("Response from Backend:", response.data); // ဒါကို Console မှာ ကြည့်ပါ

      // 🔥 ပြင်ရမယ့်နေရာ: response.data ထဲမှာ success ပါလာတာကို စစ်ရပါမယ်
      if (response.data && response.data.success === true) {
        const userData = response.data.user;

        console.log("Saving User Data:", userData);
        
        // LocalStorage ထဲ သိမ်းမယ်
        localStorage.setItem("user", JSON.stringify(userData)); 
        
        // App.js ကို လှမ်းပြောမယ်
        onLogin(userData); 
      } else {
        setError("Username သို့မဟုတ် Password မှားနေပါသည်။");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("ချိတ်ဆက်မှု အဆင်မပြေပါ။");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="login-container">
    {/* 🔥 Background Overlay */}
    <div className="bg-overlay"></div>

    <div className="login-box">
      <div className="login-logo">
        <h1 className="main-title">Restaurant POS</h1>
        <p className="tagline">Management System</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <User size={20} className="input-icon" />
          <input 
            type="text" 
            placeholder="User ID"
            value={credentials.username}
            onChange={(e) =>
              setCredentials({ ...credentials, username: e.target.value })
            }
          />
        </div>

        <div className="input-group">
          <Lock size={20} className="input-icon" />
          <input 
            type="password" 
            placeholder="Password"
            value={credentials.password}
            onChange={(e) =>
              setCredentials({ ...credentials, password: e.target.value })
            }
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="login-btn" disabled={loading}>
          <LogIn size={18} />
          {loading ? "Loading..." : "Log In"}
        </button>
      </form>
    </div>
  </div>
);
}