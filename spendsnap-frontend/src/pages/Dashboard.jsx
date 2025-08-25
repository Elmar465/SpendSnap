// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../Api.jsx";
import { decodeJwt } from "../utils/Jwts.jsx";

import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  CartesianGrid,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from "recharts";

import "../styles/Dashboard.css";

// ---- Color map for categories (fallbacks included)
const categoryColors = {
  Food: "#FFB347",
  Groceries: "#ffd166",
  Dining: "#ff9f1c",
  Coffee: "#c084fc",
  Shopping: "#ff6b81",
  Clothing: "#ee6055",
  Beauty: "#ee7a9d",
  Entertainment: "#a55eea",
  Gaming: "#B07CFF",
  Movies: "#F18F01",
  Books: "#FFD166",
  Software: "#6C63FF",
  Electronics: "#66D6FF",
  Subscriptions: "#7D82B8",
  Utilities: "#2ed573",
  Internet: "#2DD4BF",
  Phone: "#06B6D4",
  Bills: "#10B981",
  Rent: "#22C55E",
  Mortgage: "#16A34A",
  Transport: "#70a1ff",
  Fuel: "#3B82F6",
  Taxi: "#60A5FA",
  Travel: "#4F46E5",
  Vacation: "#6366F1",
  Health: "#F43F5E",
  Medical: "#EF4444",
  Insurance: "#FB7185",
  Education: "#f59e0b",
  Childcare: "#FBBF24",
  Pets: "#FCA5A5",
  Gifts: "#F472B6",
  Charity: "#E879F9",
  Home: "#94A3B8",
  Maintenance: "#9CA3AF",
  Tools: "#A78BFA",
  Office: "#64748B",
  Taxes: "#F97316",
  Savings: "#14B8A6",
  Investment: "#22D3EE",
  Debt: "#FB7185",
  Personal: "#60A5FA",
  Other: "#d2dae2",
};

// Full category list shown in the bars (zeros if no spend)
const ALL_CATEGORIES = [
  "Food ","Groceries ","Dining ","Coffee ",
  "Shopping","Clothing","Beauty",
  "Entertainment","Gaming","Movies","Books","Software","Electronics","Subscriptions",
  "Utilities","Internet","Phone","Bills","Rent","Mortgage",
  "Transport","Fuel","Taxi","Travel","Vacation",
  "Health","Medical","Insurance","Education","Childcare","Pets",
  "Gifts","Charity","Home","Maintenance","Tools","Office",
  "Taxes","Savings","Investment","Debt","Personal","Other",
];

// ===== Shorten labels (edit these if you want) =====
const SHORT_MAX = 8;
const CATEGORY_LABELS = {
  Utilities: "Utils",
  Subscriptions: "Subs",
  Entertainment: "Entertain.",
  Maintenance: "Maint.",
  Investment: "Invest.",
};
const SHORT = (name) => {
  const raw = String(name || "").trim();
  const mapped = CATEGORY_LABELS[raw] ?? raw;
  return mapped.length <= SHORT_MAX ? mapped : mapped.slice(0, SHORT_MAX) + "…";
};
const colorFor = (cat) => categoryColors[cat] || "#bbb";

// Safari-safe date normalizer
const normalizeDate = (raw) => {
  const s = String(raw);
  const d = s.length === 10 ? new Date(`${s}T00:00:00`) : new Date(s);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// ---------- Custom tick: pill label under each bar ----------
const PillTick = ({ x, y, payload }) => {
  const label = String(payload?.value ?? "");
  const charW = 7.2;
  const padX = 10;
  const h = 22;
  const w = Math.max(38, Math.round(label.length * charW) + padX * 2);

  return (
    <g transform={`translate(${x},${y})`}>
      <rect
        x={-w / 2}
        y={10}
        width={w}
        height={h}
        rx={10}
        ry={10}
        fill="rgba(255,255,255,.12)"
        stroke="rgba(255,255,255,.28)"
      />
      <text
        x={0}
        y={10 + h / 2 + 4}
        textAnchor="middle"
        fontWeight="900"
        fontSize="12"
        fill="#ffffff"
      >
        {label}
      </text>
    </g>
  );
};

export default function Dashboard() {
  const nav = useNavigate();
  const { state } = useLocation();

  // ------------------ Auth ------------------
  const token = sessionStorage.getItem("token");
  const [userId, setUserId] = useState(sessionStorage.getItem("userId") || "");

  useEffect(() => {
    if (!token) {
      nav("/login", { replace: true });
      return;
    }
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

  // ------------------ Baseline month/year (used for totals, tables, radial) ------------------
  const today = new Date();
  const [month] = useState(today.getMonth() + 1);
  const [year] = useState(today.getFullYear());

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expPage, setExpPage] = useState(1);
  const [incPage, setIncPage] = useState(1);

  // ------------------ Data ------------------
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);

  useEffect(() => {
    if (state?.refresh) {
      setExpPage(1);
      setIncPage(1);
    }
  }, [state]);

  useEffect(() => {
    if (!token || !userId) return;

    setLoading(true);
    Promise.all([
      api.get(`/expenses/getMonthlyExpensesByUser/${userId}/${month}/${year}`),
      api.get(`/income/getMonthlyIncomeByUser/${userId}/${month}/${year}`),
    ])
      .then(([expRes, incRes]) => {
        setExpenses(expRes.data || []);
        setIncomes(incRes.data || []);
      })
      .finally(() => setLoading(false));
  }, [token, userId, month, year]);

  useEffect(() => {
    setExpPage(1);
    setIncPage(1);
  }, [month, year, userId]);

  // ------------------ Mask amounts ------------------
  const [masked, setMasked] = useState(sessionStorage.getItem("maskAmounts") === "1");
  useEffect(() => {
    const onStorage = () =>
      setMasked(sessionStorage.getItem("maskAmounts") === "1");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const fmtMoney = (v) => (masked ? "••••" : Number(v || 0).toFixed(2));

  // ------------------ Helpers ------------------
  const n = (v) => (v == null || v === "" ? 0 : Number(v));
  const paginate = (arr, page, size) => arr.slice((page - 1) * size, (page - 1) * size + size);

  const expTotalPages = Math.max(1, Math.ceil(expenses.length / rowsPerPage));
  const incTotalPages = Math.max(1, Math.ceil(incomes.length / rowsPerPage));
  const expensesPage = paginate(expenses, expPage, rowsPerPage);
  const incomesPage = paginate(incomes, incPage, rowsPerPage);

  const totalSpent = expenses.reduce((s, e) => s + n(e.amount), 0);
  const totalIncome = incomes.reduce((s, i) => s + n(i.amount), 0);
  const balance = totalIncome - totalSpent;

  // ------------------ Toast ------------------
  const [toast, setToast] = useState({ open: false, kind: "success", text: "" });
  const showToast = useCallback((text, kind = "success") => {
    setToast({ open: true, text, kind });
    setTimeout(() => setToast((t) => ({ ...t, open: false })), 2200);
  }, []);

  // ------------------ Confirm Modal (Delete) ------------------
  const [confirm, setConfirm] = useState({
    open: false,
    busy: false,
    kind: "expense", // "expense" | "income"
    id: null,
    title: "",
    subtitle: "",
  });

  // Open modal
  const askDelete = (kind, item) => {
    const niceAmount = `$${Number(item.amount || 0).toLocaleString()}`;
    setConfirm({
      open: true,
      busy: false,
      kind,
      id: item.id,
      title: `Delete ${kind === "expense" ? "Expense" : "Income"}?`,
      subtitle: `${item.description || item.category || "Transaction"} · ${niceAmount} · ${
        item.date ? new Date(String(item.date) + "T00:00:00").toLocaleDateString() : ""
      }`,
    });
  };

  // ESC close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && confirm.open && !confirm.busy) {
        setConfirm((c) => ({ ...c, open: false }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm.open, confirm.busy]);

  // Perform deletion
  const performDelete = async () => {
    if (!confirm.id) return;
    setConfirm((c) => ({ ...c, busy: true }));
    try {
      if (confirm.kind === "expense") {
        await api.delete(`/expenses/delete/${confirm.id}`);
        setExpenses((prev) => prev.filter((e) => e.id !== confirm.id));
        showToast("Expense deleted.");
      } else {
        await api.delete(`/income/${confirm.id}`);
        setIncomes((prev) => prev.filter((i) => i.id !== confirm.id));
        showToast("Income deleted.");
      }
      setConfirm((c) => ({ ...c, open: false, busy: false }));
    } catch (err) {
      setConfirm((c) => ({ ...c, busy: false }));
      showToast("Failed to delete. Try again.", "error");
    }
  };

  // ------------------ Chart-only datasets + filters ------------------
  // Line chart filters
  const [lineMode, setLineMode] = useState("monthly"); // monthly | yearly | custom
  const [lineStart, setLineStart] = useState("");
  const [lineEnd, setLineEnd] = useState("");
  const [lineExp, setLineExp] = useState([]);
  const [lineInc, setLineInc] = useState([]);
  const [lineBusy, setLineBusy] = useState(false);

  // Bar chart filters
  const [barMode, setBarMode] = useState("monthly");
  const [barStart, setBarStart] = useState("");
  const [barEnd, setBarEnd] = useState("");
  const [barExp, setBarExp] = useState([]);
  const [barBusy, setBarBusy] = useState(false);

  const listMonthYearsBetween = (d1, d2) => {
    const out = [];
    const a = new Date(d1.getFullYear(), d1.getMonth(), 1);
    const b = new Date(d2.getFullYear(), d2.getMonth(), 1);
    const cur = new Date(a);
    while (cur <= b) {
      out.push({ m: cur.getMonth() + 1, y: cur.getFullYear() });
      cur.setMonth(cur.getMonth() + 1);
    }
    return out;
  };

  const fetchMonth = async (uid, m, y) => {
    const [eRes, iRes] = await Promise.all([
      api.get(`/expenses/getMonthlyExpensesByUser/${uid}/${m}/${y}`),
      api.get(`/income/getMonthlyIncomeByUser/${uid}/${m}/${y}`),
    ]);
    return {
      e: eRes?.data || [],
      i: iRes?.data || [],
    };
  };

  const loadLineData = async () => {
    if (!userId) return;
    setLineBusy(true);
    try {
      if (lineMode === "monthly") {
        setLineExp(expenses);
        setLineInc(incomes);
      } else if (lineMode === "yearly") {
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        const results = await Promise.all(months.map((m) => fetchMonth(userId, m, year)));
        const e = results.flatMap((r) => r.e);
        const i = results.flatMap((r) => r.i);
        setLineExp(e);
        setLineInc(i);
      } else {
        const s = lineStart ? normalizeDate(lineStart) : null;
        const e = lineEnd ? normalizeDate(lineEnd) : null;
        if (!s || !e || s > e) {
          setLineExp([]);
          setLineInc([]);
        } else {
          const months = listMonthYearsBetween(s, e);
          const results = await Promise.all(months.map((t) => fetchMonth(userId, t.m, t.y)));
          const allE = results.flatMap((r) => r.e).filter((x) => {
            const d = normalizeDate(x.date);
            return d >= s && d <= e;
          });
          const allI = results.flatMap((r) => r.i).filter((x) => {
            const d = normalizeDate(x.date);
            return d >= s && d <= e;
          });
          setLineExp(allE);
          setLineInc(allI);
        }
      }
    } finally {
      setLineBusy(false);
    }
  };

  const loadBarData = async () => {
    if (!userId) return;
    setBarBusy(true);
    try {
      if (barMode === "monthly") {
        setBarExp(expenses);
      } else if (barMode === "yearly") {
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        const results = await Promise.all(months.map((m) => fetchMonth(userId, m, year)));
        const e = results.flatMap((r) => r.e);
        setBarExp(e);
      } else {
        const s = barStart ? normalizeDate(barStart) : null;
        const e = barEnd ? normalizeDate(barEnd) : null;
        if (!s || !e || s > e) {
          setBarExp([]);
        } else {
          const months = listMonthYearsBetween(s, e);
          const results = await Promise.all(months.map((t) => fetchMonth(userId, t.m, t.y)));
          const allE = results.flatMap((r) => r.e).filter((x) => {
            const d = normalizeDate(x.date);
            return d >= s && d <= e;
          });
          setBarExp(allE);
        }
      }
    } finally {
      setBarBusy(false);
    }
  };

  useEffect(() => {
    loadLineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, year, expenses, incomes, lineMode]);

  useEffect(() => {
    loadBarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, year, expenses, barMode]);

  useEffect(() => {
    if (lineMode === "custom" && lineStart && lineEnd) loadLineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineStart, lineEnd]);

  useEffect(() => {
    if (barMode === "custom" && barStart && barEnd) loadBarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barStart, barEnd]);

  // ------------------ Radial chart (top category, based on baseline month) ------------------
  const categoriesAgg = useMemo(() => {
    const agg = {};
    expenses.forEach((ex) => {
      const cat = ex.category || "Other";
      agg[cat] = (agg[cat] || 0) + n(ex.amount);
    });
    return agg;
  }, [expenses]);

  const radialData = useMemo(
    () =>
      Object.entries(categoriesAgg).map(([name, value]) => ({
        name,
        value,
        fill: colorFor(name),
      })),
    [categoriesAgg]
  );
  const topCategory = radialData.slice().sort((a, b) => b.value - a.value)[0];

  // ------------------ Cumulative line chart data (per lineMode) ------------------
  const cumuData = useMemo(() => {
    if (lineMode === "yearly") {
      const expMap = {};
      const incMap = {};
      lineExp.forEach((e) => {
        const d = normalizeDate(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        expMap[key] = (expMap[key] || 0) + n(e.amount);
      });
      lineInc.forEach((i) => {
        const d = normalizeDate(i.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        incMap[key] = (incMap[key] || 0) + n(i.amount);
      });

      const keys = Array.from(new Set([...Object.keys(expMap), ...Object.keys(incMap)])).sort(
        (a, b) => a.localeCompare(b)
      );

      let ce = 0, ci = 0;
      return keys.map((k) => {
        ce += expMap[k] || 0;
        ci += incMap[k] || 0;
        return { label: k, Expense: ce, Income: ci };
      });
    } else {
      const expMap = {};
      const incMap = {};
      lineExp.forEach((e) => {
        const d = normalizeDate(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        expMap[key] = (expMap[key] || 0) + n(e.amount);
      });
      lineInc.forEach((i) => {
        const d = normalizeDate(i.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        incMap[key] = (incMap[key] || 0) + n(i.amount);
      });

      const keys = Array.from(new Set([...Object.keys(expMap), ...Object.keys(incMap)])).sort(
        (a, b) => a.localeCompare(b)
      );

      let ce = 0, ci = 0;
      return keys.map((k) => {
        ce += expMap[k] || 0;
        ci += incMap[k] || 0;
        return { label: new Date(`${k}T00:00:00`).toLocaleDateString(), Expense: ce, Income: ci };
      });
    }
  }, [lineMode, lineExp, lineInc]);

  // ------------------ Expense by Category bars (per barMode) ------------------
  const barsData = useMemo(() => {
    const sums = {};
    ALL_CATEGORIES.forEach((c) => (sums[c.trim()] = 0));
    barExp.forEach((e) => {
      const cat = (e.category || "Other").trim();
      if (sums[cat] == null) sums[cat] = 0;
      sums[cat] += n(e.amount);
    });

    return ALL_CATEGORIES.map((raw) => {
      const c = raw.trim();
      const amt = Number((sums[c] || 0).toFixed(2));
      return { cat: SHORT(c), full: c, amount: amt, fill: colorFor(c) };
    });
  }, [barExp]);

  // ------------------ UI ------------------
  const Pagination = ({ page, total, onPrev, onNext }) => (
    <div className="pagination">
      <button onClick={onPrev} disabled={page <= 1} aria-label="Previous page">‹</button>
      <span>Page {page} / {total}</span>
      <button onClick={onNext} disabled={page >= total} aria-label="Next page">›</button>
    </div>
  );

  // Tooltip style
  const tooltipStyle = {
    background: "#1d1533",
    border: "1px solid rgba(255,255,255,.18)",
    borderRadius: 12,
    color: "#fff",
    boxShadow: "0 8px 28px rgba(0,0,0,.35)",
  };
  const tooltipLabel = { color: "#ffd86f", fontWeight: 900 };
  const tooltipItem = { color: "#fff", fontWeight: 800 };

  // ======= H-scroll sizing for bar chart so every label has space =======
  const BAR_SIZE = 26;           // width of each bar
  const CATEGORY_SLOT = 90;      // px reserved per category (bar + pill + gap)
  const CHART_MIN_W = 900;       // don’t get smaller than view
  const chartW = Math.max(barsData.length * CATEGORY_SLOT, CHART_MIN_W);

  return (
    <div className="dashboard-bg-boss">
      <motion.div
        className="dashboard-glass-boss"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: "spring" }}
      >
        {/* Title + mask toggle */}
        <div className="dashboard-title-boss" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="brand-logo" role="img" aria-label="globe">🌎</span>
          <span className="brandword">
            <span className="brand-primary">Spend</span>
            <span className="brand-accent">Snap</span>
            <span className="brand-sub">Dashboard</span>
          </span>
          <button
            className={`mask-toggle-btn ${masked ? "is-on" : ""}`}
            onClick={() => {
              const next = !masked;
              setMasked(next);
              sessionStorage.setItem("maskAmounts", next ? "1" : "0");
              window.dispatchEvent(new StorageEvent("storage", { key: "maskAmounts" }));
            }}
            title={masked ? "Show amounts" : "Hide amounts"}
            style={{ marginLeft: "auto" }}
          >
            {masked ? "🙈 Hidden" : "👀 Visible"}
          </button>
        </div>

        {/* Totals & radial */}
        <div className="dashboard-summary-boss" style={{ alignItems: "flex-start" }}>
          <motion.div className="total-card-boss">
            <span className="currency-boss">$</span>
            <span className="total-boss">{fmtMoney(totalSpent)}</span>
            <div className="total-label-boss">Total Spent</div>
          </motion.div>

          <motion.div className="total-card-boss" style={{ background: "linear-gradient(135deg,#27e698,#b3ff7a)" }}>
            <span className="currency-boss" style={{ color: "#38df6b" }}>+</span>
            <span className="total-boss">{fmtMoney(totalIncome)}</span>
            <div className="total-label-boss">Total Income</div>
          </motion.div>

          <motion.div className="total-card-boss" style={{ background: "linear-gradient(135deg,#ffeead,#ff6f61)" }}>
            <span className="currency-boss" style={{ color: "#ff9b3e" }}>=</span>
            <span className="total-boss">{fmtMoney(balance)}</span>
            <div className="total-label-boss">Balance</div>
          </motion.div>

          {/* Radial Chart */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="radial-chart-boss">
              <ResponsiveContainer width={320} height={320}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="90%"
                  barSize={25}
                  data={radialData}
                  startAngle={90}
                  endAngle={450}
                >
                  <RadialBar minAngle={16} background clockWise dataKey="value" />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} itemStyle={tooltipItem}
                    formatter={(val) => (masked ? "••••" : `$${Number(val).toLocaleString()}`)}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="top-category-glow">
                <span role="img" aria-label="crown">👑</span> Top: <b>{topCategory?.name || "—"}</b>
              </div>
            </div>
          </div>
        </div>

        {/* Cumulative Line Chart */}
        <div className="trend-chart-boss">
          <div className="section-header">
            <h4>Cumulative Income vs Expenses Over Time</h4>
            <div className="chip-row">
              <button className={`chip ${lineMode === "monthly" ? "is-active" : ""}`} onClick={() => setLineMode("monthly")} type="button">Monthly</button>
              <button className={`chip ${lineMode === "yearly" ? "is-active" : ""}`} onClick={() => setLineMode("yearly")} type="button">Yearly</button>
              <button className={`chip ${lineMode === "custom" ? "is-active" : ""}`} onClick={() => setLineMode("custom")} type="button">Custom</button>
              {lineMode === "custom" && (
                <>
                  <input type="date" value={lineStart} onChange={(e) => setLineStart(e.target.value)} className="chip" style={{ padding: "6px 10px" }} />
                  <input type="date" value={lineEnd} onChange={(e) => setLineEnd(e.target.value)} className="chip" style={{ padding: "6px 10px" }} />
                  <button className="chip" onClick={loadLineData} type="button">Apply</button>
                </>
              )}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cumuData}>
              <CartesianGrid stroke="#ffffff22" strokeDasharray="4 8" />
              <XAxis dataKey="label" tick={{ fill: "#fff", fontWeight: 900, fontSize: 12 }} />
              <YAxis tick={{ fill: "#fff", fontWeight: 900, fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} itemStyle={tooltipItem}
                formatter={(val) => (masked ? "••••" : `$${Number(val).toLocaleString()}`)} />
              <Legend wrapperStyle={{ color: "#fff", fontWeight: 800 }} />
              <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={3.5} dot={{ r: 3 }} activeDot={{ r: 6 }} isAnimationActive={!lineBusy} />
              <Line type="monotone" dataKey="Income" stroke="#22c55e" strokeWidth={3.5} dot={{ r: 3 }} activeDot={{ r: 6 }} isAnimationActive={!lineBusy} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense by Category Bars (scrollable, pill labels) */}
        <div className="trend-chart-boss" style={{ marginTop: 18 }}>
          <div className="section-header">
            <h4>Expense by Category</h4>
            <div className="chip-row">
              <button className={`chip ${barMode === "monthly" ? "is-active" : ""}`} onClick={() => setBarMode("monthly")} type="button">Monthly</button>
              <button className={`chip ${barMode === "yearly" ? "is-active" : ""}`} onClick={() => setBarMode("yearly")} type="button">Yearly</button>
              <button className={`chip ${barMode === "custom" ? "is-active" : ""}`} onClick={() => setBarMode("custom")} type="button">Custom</button>
              {barMode === "custom" && (
                <>
                  <input type="date" value={barStart} onChange={(e) => setBarStart(e.target.value)} className="chip" style={{ padding: "6px 10px" }} />
                  <input type="date" value={barEnd} onChange={(e) => setBarEnd(e.target.value)} className="chip" style={{ padding: "6px 10px" }} />
                  <button className="chip" onClick={loadBarData} type="button">Apply</button>
                </>
              )}
            </div>
          </div>

          <div style={{ overflowX: "auto", paddingBottom: 8 }}>
            <div style={{ width: chartW }}>
              <BarChart
                width={chartW}
                height={340}
                data={barsData}
                margin={{ left: 8, right: 12, bottom: 28 }}
                barSize={26}
                barGap={24}
                barCategoryGap="30%"
              >
                <defs>
                  {barsData.map((d, i) => (
                    <linearGradient key={`g-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={d.fill} stopOpacity={0.98} />
                      <stop offset="100%" stopColor={d.fill} stopOpacity={0.65} />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid vertical={false} stroke="#ffffff22" />

                <XAxis
                  dataKey="cat"
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,.25)" }}
                  height={64}
                  tick={<PillTick />}
                />

                <YAxis tick={{ fill: "#fff", fontWeight: 900, fontSize: 12 }} />

                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabel}
                  itemStyle={tooltipItem}
                  formatter={(val, _name, entry) =>
                    masked
                      ? "••••"
                      : [`$${Number(val).toLocaleString()}`, entry?.payload?.full]
                  }
                  labelFormatter={() => ""}
                />

                <Bar dataKey="amount" radius={[12, 12, 0, 0]} isAnimationActive={!barBusy}>
                  {barsData.map((d, i) => (
                    <Cell key={`c-${i}`} fill={`url(#barGrad-${i})`} stroke={d.fill} strokeWidth={1.2} />
                  ))}
                  <LabelList
                    dataKey="amount"
                    position="top"
                    formatter={(v) => (v ? (masked ? "••••" : `$${Number(v).toLocaleString()}`) : "")}
                    style={{ fontWeight: 900, fill: "#fff" }}
                  />
                </Bar>
              </BarChart>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <motion.div className="expenses-list" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3>Your Expenses</h3>
          {loading ? (
            <div className="dashboard-loading">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="dashboard-empty">No expenses found.</div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="expenses-table table-sticky">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expensesPage.map((ex) => (
                      <tr key={ex.id}>
                        <td>{ex.description || <span style={{ opacity: 0.6 }}>—</span>}</td>
                        <td>
                          <span className="cat-dot" style={{ background: colorFor((ex.category || "Other").trim()) }} />
                          ${fmtMoney(ex.amount)}
                        </td>
                        <td>{ex.date ? new Date(String(ex.date) + "T00:00:00").toLocaleDateString() : "-"}</td>
                        <td>
                          <span className="cat-badge" data-category={(ex.category || "Other").trim()}>
                            {(ex.category || "Other").trim()}
                          </span>
                        </td>
                        <td>
                          <button
                            className="chip chip--danger"
                            type="button"
                            onClick={() => askDelete("expense", ex)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={expPage}
                total={expTotalPages}
                onPrev={() => setExpPage((p) => Math.max(1, p - 1))}
                onNext={() => setExpPage((p) => Math.min(expTotalPages, p + 1))}
              />
            </>
          )}
        </motion.div>

        {/* Incomes Table */}
        <motion.div
          className="expenses-list"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ marginTop: 28, background: "rgba(24,36,16,0.94)" }}
        >
          <h3>Your Incomes</h3>
          {loading ? (
            <div className="dashboard-loading">Loading...</div>
          ) : incomes.length === 0 ? (
            <div className="dashboard-empty">No incomes found.</div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="expenses-table table-sticky">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomesPage.map((inc) => (
                      <tr key={inc.id}>
                        <td>{inc.description || <span style={{ opacity: 0.6 }}>—</span>}</td>
                        <td><span className="cat-dot" style={{ background: "#22c55e" }} />${fmtMoney(inc.amount)}</td>
                        <td>{inc.date ? new Date(String(inc.date) + "T00:00:00").toLocaleDateString() : "-"}</td>
                        <td>
                          <span className="cat-badge" style={{ background: "#22c55e", color: "#0a2917" }}>
                            {inc.category || "Other"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="chip chip--danger"
                            type="button"
                            onClick={() => askDelete("income", inc)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={incPage}
                total={incTotalPages}
                onPrev={() => setIncPage((p) => Math.max(1, p - 1))}
                onNext={() => setIncPage((p) => Math.min(incTotalPages, p + 1))}
              />
            </>
          )}
        </motion.div>
      </motion.div>

      {/* ===== Confirmation Modal ===== */}
      {confirm.open && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal">
            <div className="confirm-head">
              <div className="confirm-icon">🗑️</div>
              <div>
                <h3>{confirm.title}</h3>
                <div className="confirm-sub">{confirm.subtitle}</div>
              </div>
            </div>
            <div className="confirm-actions">
              <button
                className="chip chip--ghost"
                disabled={confirm.busy}
                onClick={() => setConfirm((c) => ({ ...c, open: false }))}
              >
                Cancel
              </button>
              <button
                className="chip chip--danger"
                disabled={confirm.busy}
                onClick={performDelete}
              >
                {confirm.busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Toast ===== */}
      {toast.open && (
        <div className={`toast ${toast.kind === "error" ? "toast--error" : "toast--ok"}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
