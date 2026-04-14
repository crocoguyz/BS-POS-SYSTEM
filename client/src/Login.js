import React, { useState } from "react";
import { Lock, User, LogIn } from "lucide-react";
import "./login.css";

export default function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // ယာယီစမ်းသပ်ရန် Logic (Backend ချိတ်ရင် axios နဲ့ ပြန်ပြင်ရပါမယ်)
    if (credentials.username === "admin" && credentials.password === "123") {
      onLogin({ name: "Dar Go", role: "admin" });
    } else if (credentials.username === "cashier" && credentials.password === "123") {
      onLogin({ name: "Koko", role: "cashier" });
    } else {
      setError("Username သို့မဟုတ် Password မှားနေပါသည်။");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <h2>BS <span>POS</span></h2>
          <p>Management System</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <User size={20} className="input-icon" />
            <input 
              type="text" 
              placeholder="Username" 
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              required 
            />
          </div>
          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input 
              type="password" 
              placeholder="Password" 
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required 
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="login-btn">
            <LogIn size={18} /> Login
          </button>
        </form>
      </div>
    </div>
  );
}