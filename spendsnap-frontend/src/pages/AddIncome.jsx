// src/pages/AddIncome.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../Api.jsx";
import { decodeJwt } from "../utils/Jwts.jsx";
import "../styles/AddExpense.css"; // reuse the same styles

const incomeCategories = [
  "Salary",
  "Bonus",
  "Freelance",
  "Investment",
  "Gift",
  "Other",
];

export default function AddIncome() {
  const [form, setForm] = useState({
    amount: "",
    description: "",
    date: "",
    category: incomeCategories[0],
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  const nav = useNavigate();
  const token = sessionStorage.getItem("token");

  // Must be logged in
  useEffect(() => {
    if (!token) nav("/login", { replace: true });
  }, [token, nav]);

  // Resolve userId from current token (prevents cross-user leakage)
  useEffect(() => {
    if (!token) return;
    const sub = decodeJwt(token)?.sub || sessionStorage.getItem("username");
    if (!sub) return;

    api
      .get("/user/getUserByName", { params: { name: sub } })
      .then((r) => {
        const id = String(r?.data?.id ?? r?.data?.userId ?? "");
        if (!id) throw new Error("User id not found");
        sessionStorage.setItem("username", sub);
        sessionStorage.setItem("userId", id);
        setUserId(id);
      })
      .catch(() => {
        sessionStorage.clear();
        nav("/login", { replace: true });
      });
  }, [token, nav]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount" && Number(value) < 0) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setMessage("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        userId,
        amount: form.amount === "" ? 0 : Number(form.amount),
      };

      // Backend endpoint from your IncomeController
      await api.post("/income/addIncome", payload);

      setMessage("✅ Income added!");
      setForm({
        amount: "",
        description: "",
        date: "",
        category: incomeCategories[0],
      });

      nav("/dashboard", { state: { refresh: true }, replace: true });
    } catch (error) {
      setMessage(
        "❌ Failed to add income: " +
          (error?.response?.data || error?.message || "Unknown error")
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
        <h2 className="add-expense-title">💰 Add Income</h2>

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
              inputMode="decimal"
            />
          </div>

          <div className="form-row">
            <label>
              Description{" "}
              <span style={{ fontWeight: "normal", color: "#aaa" }}>
                (optional)
              </span>
            </label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={120}
              placeholder="What's this income?"
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
              {incomeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <motion.button
            type="submit"
            disabled={loading || !userId}
            whileHover={{
              scale: 1.04,
              background: "linear-gradient(90deg, #f7ce68 20%, #8e54e9 90%)",
              color: "#fff",
              boxShadow: "0 4px 32px #8e54e988, 0 2px 8px #f7ce6899",
            }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? "Saving..." : "Add Income"}
          </motion.button>

          {message && <div className="add-expense-message">{message}</div>}
        </form>
      </motion.div>
    </div>
  );
}
