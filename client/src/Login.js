import React, { useState } from "react";
import { Lock, User, LogIn } from "lucide-react";
import axios from "axios"; // axios ကို သုံးမယ်
import "./login.css";
import bgImage from "./assets/bg-kitchen.png";

export default function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Render Backend Link သို့ data ပို့မယ်
      const response = await axios.post("https://bs-pos-system.onrender.com/api/login", credentials);
      
      // Backend က success ဖြစ်တယ်ဆိုရင်
      if (response.data && response.data.success) {
  localStorage.setItem("user", JSON.stringify(response.data.user)); // 🔥 SAVE USER
  onLogin(response.data.user); // App.js ကို pass
} else {
        setError("Username သို့မဟုတ် Password မှားနေပါသည်။");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Server ချိတ်ဆက်မှု အဆင်မပြေပါ။ ခဏနေမှ ပြန်ကြိုးစားကြည့်ပါ။");
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
            placeholder="Employee ID"
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