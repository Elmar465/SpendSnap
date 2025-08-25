import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import "../styles/Register.css";

const Register = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8080/user/register", form);
      setMessage("Registration successful! You can now log in.");
      setForm({ username: "", password: "" });
    } catch (error) {
      setMessage("Registration failed: " + (error.response?.data || "Unknown error"));
    }
  };

  return (
    <div className="auth-bg">
      <motion.div
        className="glass-auth-card"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <motion.div
          className="logo-glow"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
        >
          <svg width="50" height="50" viewBox="0 0 54 54">
            <defs>
              <radialGradient id="glowReg" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#FFDF78" />
                <stop offset="100%" stopColor="#7367F0" />
              </radialGradient>
            </defs>
            <circle cx="27" cy="27" r="24" fill="url(#glowReg)" opacity="0.8" />
            <text x="50%" y="57%" textAnchor="middle" fill="#fff" fontSize="23" fontWeight="bold" dy=".3em" fontFamily="Montserrat, sans-serif">S$</text>
          </svg>
        </motion.div>
        <motion.h2
          className="auth-title"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          Create Your Account
        </motion.h2>
        <form className="crazy-auth-form" onSubmit={handleSubmit}>
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
              initial={{ backgroundColor: "#121212" }}
              whileFocus={{ scale: 1.03, boxShadow: "0 0 0 2px #7367F0aa" }}
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
              initial={{ backgroundColor: "#121212" }}
              whileFocus={{ scale: 1.03, boxShadow: "0 0 0 2px #FFDF78cc" }}
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{
              scale: 1.04,
              background: "linear-gradient(90deg, #7367F0 20%, #FFDF78 80%)",
              boxShadow: "0 4px 20px #7367F088"
            }}
            whileTap={{ scale: 0.97 }}
          >
            Register
          </motion.button>
          {message && <div className="message">{message}</div>}
        </form>
        <div className="auth-footer">
          <span>Already have an account?</span>
          <a href="/login">Login</a>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
