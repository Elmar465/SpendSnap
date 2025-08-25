// src/pages/Login.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../Api.jsx";
import { decodeJwt } from "../utils/Jwts.jsx";
import "../styles/Login.css";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Your backend returns either a raw token string or { token: "..." }
      const res = await api.post("/user/login", form, { responseType: "text" });
      let token = typeof res.data === "string" ? res.data : res.data?.token;
      if (!token) throw new Error("No token returned from /user/login");

      // Normalize in case it’s prefixed with "Bearer "
      if (token.startsWith("Bearer ")) token = token.slice(7);

      // 🔒 wipe any previous session (avoids cross-user leakage after relogin)
      sessionStorage.clear();

      // Save fresh token
      sessionStorage.setItem("token", token);

      // Save username (from JWT subject or the entered value)
      const sub = decodeJwt(token)?.sub;
      sessionStorage.setItem("username", sub || form.username);

      // 👉 Go straight to dashboard; pages will resolve userId from the token
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Unknown error";
      setMessage("Login failed: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sexy-login-bg">
      <div className="aurora-blur blur-1"></div>
      <div className="aurora-blur blur-2"></div>

      <motion.div
        className="sexy-glass-card"
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, type: "spring" }}
      >
        <motion.h2
          className="sexy-login-title"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <span className="gold-text">Welcome Back</span>
        </motion.h2>

        <form className="sexy-login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <motion.input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="off"
              placeholder="Enter username"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <motion.input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="off"
              placeholder="Enter password"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? "Signing in..." : "Login"}
          </motion.button>

          {message && <div className="sexy-message">{message}</div>}
        </form>

        <div className="sexy-login-footer">
          <span>Don’t have an account?</span>
          <a href="/register">Register</a>
        </div>
      </motion.div>
    </div>
  );
}
