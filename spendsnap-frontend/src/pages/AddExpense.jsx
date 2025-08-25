import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../Api.jsx";
import "../styles/AddExpense.css";

// 2) Big list of categories
const categoryOptions = [
  "Food","Groceries","Dining","Coffee",
  "Shopping","Clothing","Beauty",
  "Entertainment","Gaming","Movies","Books","Software","Electronics","Subscriptions",
  "Utilities","Internet","Phone","Bills","Rent","Mortgage",
  "Transport","Fuel","Taxi","Travel","Vacation",
  "Health","Medical","Insurance","Education","Childcare","Pets",
  "Gifts","Charity","Home","Maintenance","Tools","Office",
  "Taxes","Savings","Investment","Debt","Personal","Other"
];

export default function AddExpense() {
  const [form, setForm] = useState({
    amount: "",
    description: "",
    date: "",
    category: categoryOptions[0],
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId") || "";

  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (!userId || !token) throw new Error("Not authenticated");
      const payload = { ...form, userId };
      await api.post("/expenses/addExpenses", payload);
      setMessage("✅ Expense added!");
      setForm({
        amount: "",
        description: "",
        date: "",
        category: categoryOptions[0],
      });
      navigate("/dashboard", { state: { refresh: true }, replace: true });
    } catch (err) {
      setMessage(
        "❌ Failed to add expense: " +
          (err.response?.data || err.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-expense-bg">
      <motion.div
        className="add-expense-glass"
        initial={{ opacity: 0, y: 44, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: "spring" }}
      >
        <h2 className="add-expense-title">➕ Add Expense</h2>
        <form className="add-expense-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Amount</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              placeholder="$"
            />
          </div>
          <div className="form-row">
            <label>Description <span style={{ fontWeight: "normal", color: "#aaa" }}>(optional)</span></label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={120}
              placeholder="What's this expense?"
            />
          </div>
          <div className="form-row">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <label>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{
              scale: 1.04,
              background:
                "linear-gradient(90deg, #f7ce68 20%, #8e54e9 90%)",
              color: "#fff",
              boxShadow: "0 4px 32px #8e54e988, 0 2px 8px #f7ce6899",
            }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? "Saving..." : "Add Expense"}
          </motion.button>
          {message && (
            <div className="add-expense-message">{message}</div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
