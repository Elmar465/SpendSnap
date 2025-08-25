// ============================
// src/pages/SavingAccount.jsx
// ============================
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../Api.jsx";

const fmt = (masked, v) => (masked ? "••••" : Number(v || 0).toFixed(2));

const emptyForm = {
  name: "",
  currency: "USD",
  opening_balance: 0,
  interestApr: 0,
  compounding: "MONTHLY",
  day_count_conversion: "ACT_365F",
  notes: "",
};

export default function SavingAccount() {
  const nav = useNavigate();
  const token = sessionStorage.getItem("token");

  // gate
  useEffect(() => {
    if (!token) nav("/login", { replace: true });
  }, [token, nav]);

  // mask toggle synced with Dashboard
  const [masked, setMasked] = useState(sessionStorage.getItem("maskAmounts") === "1");
  useEffect(() => {
    const onStorage = () => setMasked(sessionStorage.getItem("maskAmounts") === "1");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ACTIVE"); // ACTIVE | INACTIVE | ALL
  const [search, setSearch] = useState("");

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);

  const [editing, setEditing] = useState({ open: false, acc: null });
  const [moneyDlg, setMoneyDlg] = useState({
    open: false,
    kind: "deposit",
    id: null,
    name: "",
    amount: "",
    memo: "",
  });
  const [transferDlg, setTransferDlg] = useState({
    open: false,
    fromId: null,
    toId: null,
    amount: "",
    memo: "",
  });

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ open: false, kind: "ok", text: "" });

  const showToast = (text, kind = "ok") => {
    setToast({ open: true, kind, text });
    setTimeout(() => setToast({ open: false, kind: "ok", text: "" }), 2200);
  };

  const reload = () => {
    setLoading(true);
    api
      .get(`/savingAccount`, { params: statusFilter === "ALL" ? {} : { status: statusFilter } })
      .then((r) => setAccounts(r?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => !q || (a.name || "").toLowerCase().includes(q));
  }, [accounts, search]);

  const totalsByCur = useMemo(() => {
    const m = {};
    accounts.forEach((a) => {
      const cur = (a.currency || "").toUpperCase() || "—";
      m[cur] = (m[cur] || 0) + Number(a.opening_balance || 0);
    });
    return m;
  }, [accounts]);

  const allActive = useMemo(
    () => accounts.filter((a) => a.status === "ACTIVE"),
    [accounts]
  );

  // ----- Actions -----
  const create = async () => {
    setBusy(true);
    try {
      const body = { ...createForm };
      await api.post(`/savingAccount`, body);
      setCreating(false);
      setCreateForm(emptyForm);
      reload();
      showToast("Account created.");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to create", "err");
    } finally {
      setBusy(false);
    }
  };

  const openMoney = (kind, acc) =>
    setMoneyDlg({
      open: true,
      kind,
      id: acc.id,
      name: acc.name,
      amount: "",
      memo: "",
    });

  const doMoney = async () => {
    const { kind, id, amount, memo } = moneyDlg;
    if (!id) return;
    setBusy(true);
    try {
      const path = kind === "deposit" ? "deposit" : "withdraw";
      await api.post(`/savingAccount/${id}/${path}`, {
        amount: Number(amount || 0),
        memo,
      });
      setMoneyDlg({
        open: false,
        kind: "deposit",
        id: null,
        name: "",
        amount: "",
        memo: "",
      });
      reload();
      showToast(kind === "deposit" ? "Deposited." : "Withdrawn.");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed", "err");
    } finally {
      setBusy(false);
    }
  };

  const openTransfer = (from) =>
    setTransferDlg({ open: true, fromId: from.id, toId: null, amount: "", memo: "" });

  const doTransfer = async () => {
    const { fromId, toId, amount, memo } = transferDlg;
    if (!fromId || !toId) return;
    setBusy(true);
    try {
      await api.post(`/savingAccount/transfer`, {
        fromId,
        toId,
        amount: Number(amount || 0),
        memo,
      });
      setTransferDlg({ open: false, fromId: null, toId: null, amount: "", memo: "" });
      reload();
      showToast("Transferred.");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed", "err");
    } finally {
      setBusy(false);
    }
  };

  const archive = async (acc) => {
    setBusy(true);
    try {
      await api.post(`/savingAccount/${acc.id}/archive`);
      reload();
      showToast("Archived.");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed", "err");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (acc) => {
    if (!window.confirm("Delete this account? Balance must be 0.")) return;
    setBusy(true);
    try {
      await api.delete(`/savingAccount/${acc.id}`);
      reload();
      showToast("Deleted.");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed", "err");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (acc) => setEditing({ open: true, acc: { ...acc } });

  const doEdit = async () => {
    const acc = editing.acc;
    setBusy(true);
    try {
      const patch = {
        name: acc.name,
        currency: acc.currency,
        status: acc.status,
        interestApr: acc.interestApr,
        compounding: acc.compounding,
        day_count_conversion: acc.day_count_conversion,
        notes: acc.notes,
      };
      await api.patch(`/savingAccount/${acc.id}`, patch);
      setEditing({ open: false, acc: null });
      reload();
      showToast("Updated.");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed", "err");
    } finally {
      setBusy(false);
    }
  };

  // ===== Render =====
  return (
    <div className="dashboard-bg-boss">
      <motion.div
        className="dashboard-glass-boss"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        {/* Title */}
        <div
          className="dashboard-title-boss"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <span className="brand-logo" role="img" aria-label="bank">
            🏦
          </span>
          <span className="brandword">
            <span className="brand-primary">Saving</span>
            <span className="brand-accent">Accounts</span>
          </span>

          <button
            className={`mask-toggle-btn ${masked ? "is-on" : ""}`}
            style={{ marginLeft: "auto" }}
            onClick={() => {
              const next = !masked;
              setMasked(next);
              sessionStorage.setItem("maskAmounts", next ? "1" : "0");
              window.dispatchEvent(new StorageEvent("storage", { key: "maskAmounts" }));
            }}
          >
            {masked ? "🙈 Hidden" : "👀 Visible"}
          </button>
        </div>

        {/* Toolbar */}
        <div className="section-header" style={{ gap: 10, alignItems: "center" }}>
          <div className="chip-row">
            <button
              className={`chip ${statusFilter === "ACTIVE" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("ACTIVE")}
              type="button"
            >
              Active
            </button>
            <button
              className={`chip ${statusFilter === "INACTIVE" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("INACTIVE")}
              type="button"
            >
              Inactive
            </button>
            <button
              className={`chip ${statusFilter === "ALL" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("ALL")}
              type="button"
            >
              All
            </button>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="chip"
              style={{ padding: "6px 10px", minWidth: 220 }}
            />
            <button className="chip" type="button" onClick={() => setCreating(true)}>
              + New Account
            </button>
          </div>
        </div>

        {/* Totals by currency */}
        <div
          className="dashboard-summary-boss"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}
        >
          {Object.entries(totalsByCur).map(([cur, sum]) => (
            <div
              key={cur}
              className="total-card-boss"
              style={{ background: "linear-gradient(135deg,#232c3a,#394b63)", padding: 16 }}
            >
              <div style={{ fontSize: 12, opacity: 0.8 }}>Total ({cur})</div>
              <div className="total-boss" style={{ fontSize: 28 }}>
                {fmt(masked, sum)}
              </div>
            </div>
          ))}
        </div>

        {/* List */}
        <motion.div
          className="expenses-list"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginTop: 16 }}
        >
          <h3>Your Saving Accounts</h3>
          {loading ? (
            <div className="dashboard-loading">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="dashboard-empty">No accounts found.</div>
          ) : (
            <div className="table-wrap">
              <table className="expenses-table table-sticky">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Currency</th>
                    <th>Balance</th>
                    <th>APR %</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th style={{ minWidth: 360 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td>{a.name || <span style={{ opacity: 0.6 }}>—</span>}</td>
                      <td>{(a.currency || "").toUpperCase() || "—"}</td>
                      <td>${fmt(masked, a.opening_balance)}</td>
                      <td>{Number(a.interestApr || 0).toFixed(2)}</td>
                      <td>
                        <span
                          className="cat-badge"
                          style={{
                            background: a.status === "ACTIVE" ? "#22c55e" : "#64748B",
                            color: a.status === "ACTIVE" ? "#0a2917" : "#0f172a",
                          }}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td>
                        {a.updated_at
                          ? new Date(String(a.updated_at)).toLocaleString()
                          : "-"}
                      </td>
                      <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="chip"
                          type="button"
                          disabled={busy || a.status !== "ACTIVE"}
                          onClick={() => openMoney("deposit", a)}
                        >
                          Deposit
                        </button>
                        <button
                          className="chip"
                          type="button"
                          disabled={busy || a.status !== "ACTIVE"}
                          onClick={() => openMoney("withdraw", a)}
                        >
                          Withdraw
                        </button>
                        <button
                          className="chip"
                          type="button"
                          disabled={busy || a.status !== "ACTIVE"}
                          onClick={() => openTransfer(a)}
                        >
                          Transfer
                        </button>
                        <button
                          className="chip"
                          type="button"
                          disabled={busy}
                          onClick={() => startEdit(a)}
                        >
                          Edit
                        </button>
                        {a.status === "ACTIVE" ? (
                          <button
                            className="chip chip--ghost"
                            type="button"
                            disabled={busy}
                            onClick={() => archive(a)}
                          >
                            Archive
                          </button>
                        ) : (
                          <button
                            className="chip chip--danger"
                            type="button"
                            disabled={busy}
                            onClick={() => remove(a)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ===== Create Modal ===== */}
      {creating && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal" style={{ maxWidth: 560 }}>
            <div className="confirm-head">
              <div className="confirm-icon">➕</div>
              <div>
                <h3>New Saving Account</h3>
                <div className="confirm-sub">Set the initial details.</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 10 }}>
                <input
                  className="chip"
                  placeholder="Name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
                <input
                  className="chip"
                  placeholder="Currency (e.g. USD)"
                  value={createForm.currency}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))
                  }
                />
                <input
                  className="chip"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="Opening balance"
                  value={createForm.opening_balance}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, opening_balance: e.target.value }))
                  }
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <input
                  className="chip"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="APR %"
                  value={createForm.interestApr}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, interestApr: e.target.value }))
                  }
                />
                <select
                  className="chip"
                  value={createForm.compounding}
                  onChange={(e) => setCreateForm((f) => ({ ...f, compounding: e.target.value }))}
                >
                  <option value="DAILY">DAILY</option>
                  <option value="MONTHLY">MONTHLY</option>
                </select>
                <select
                  className="chip"
                  value={createForm.day_count_conversion}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, day_count_conversion: e.target.value }))
                  }
                >
                  <option value="ACT_365F">ACT_365F</option>
                </select>
              </div>

              <textarea
                className="chip"
                rows={3}
                placeholder="Notes (optional)"
                value={createForm.notes}
                onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="confirm-actions">
              <button
                className="chip chip--ghost"
                disabled={busy}
                onClick={() => setCreating(false)}
              >
                Cancel
              </button>
              <button className="chip" disabled={busy} onClick={create}>
                {busy ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Deposit / Withdraw Modal ===== */}
      {moneyDlg.open && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal" style={{ maxWidth: 520 }}>
            <div className="confirm-head">
              <div className="confirm-icon">{moneyDlg.kind === "deposit" ? "💰" : "💸"}</div>
              <div>
                <h3>{moneyDlg.kind === "deposit" ? "Deposit" : "Withdraw"}</h3>
                <div className="confirm-sub">{moneyDlg.name}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <input
                className="chip"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="Amount"
                value={moneyDlg.amount}
                onChange={(e) =>
                  setMoneyDlg((d) => ({ ...d, amount: e.target.value }))
                }
              />
              <input
                className="chip"
                placeholder="Memo (optional)"
                value={moneyDlg.memo}
                onChange={(e) => setMoneyDlg((d) => ({ ...d, memo: e.target.value }))}
              />
            </div>

            <div className="confirm-actions">
              <button
                className="chip chip--ghost"
                disabled={busy}
                onClick={() => setMoneyDlg((d) => ({ ...d, open: false }))}
              >
                Cancel
              </button>
              <button className="chip" disabled={busy} onClick={doMoney}>
                {busy ? "Working…" : moneyDlg.kind === "deposit" ? "Deposit" : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Transfer Modal ===== */}
      {transferDlg.open && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal" style={{ maxWidth: 560 }}>
            <div className="confirm-head">
              <div className="confirm-icon">🔁</div>
              <div>
                <h3>Transfer</h3>
                <div className="confirm-sub">Move funds between your accounts.</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <select
                  className="chip"
                  value={transferDlg.fromId || ""}
                  onChange={(e) =>
                    setTransferDlg((d) => ({
                      ...d,
                      fromId: Number(e.target.value) || null,
                      toId: null, // reset target if from changes
                    }))
                  }
                >
                  <option value="">From account…</option>
                  {allActive.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {(a.currency || "").toUpperCase()} · {fmt(false, a.opening_balance)}
                    </option>
                  ))}
                </select>

                <select
                  className="chip"
                  value={transferDlg.toId || ""}
                  onChange={(e) =>
                    setTransferDlg((d) => ({
                      ...d,
                      toId: Number(e.target.value) || null,
                    }))
                  }
                >
                  <option value="">To account…</option>
                  {allActive
                    .filter(
                      (a) =>
                        a.id !== transferDlg.fromId &&
                        (!transferDlg.fromId ||
                          a.currency?.toUpperCase() ===
                            allActive.find((x) => x.id === transferDlg.fromId)?.currency?.toUpperCase())
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} · {(a.currency || "").toUpperCase()} · {fmt(false, a.opening_balance)}
                      </option>
                    ))}
                </select>
              </div>

              <input
                className="chip"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="Amount"
                value={transferDlg.amount}
                onChange={(e) =>
                  setTransferDlg((d) => ({ ...d, amount: e.target.value }))
                }
              />
              <input
                className="chip"
                placeholder="Memo (optional)"
                value={transferDlg.memo}
                onChange={(e) => setTransferDlg((d) => ({ ...d, memo: e.target.value }))}
              />
            </div>

            <div className="confirm-actions">
              <button
                className="chip chip--ghost"
                disabled={busy}
                onClick={() => setTransferDlg((d) => ({ ...d, open: false }))}
              >
                Cancel
              </button>
              <button className="chip" disabled={busy} onClick={doTransfer}>
                {busy ? "Working…" : "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Edit Modal ===== */}
      {editing.open && editing.acc && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal" style={{ maxWidth: 560 }}>
            <div className="confirm-head">
              <div className="confirm-icon">✏️</div>
              <div>
                <h3>Edit Account</h3>
                <div className="confirm-sub">{editing.acc.name || "(Unnamed)"}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 160px", gap: 10 }}>
                <input
                  className="chip"
                  placeholder="Name"
                  value={editing.acc.name || ""}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, acc: { ...s.acc, name: e.target.value } }))
                  }
                />
                <input
                  className="chip"
                  placeholder="Currency"
                  value={editing.acc.currency || ""}
                  onChange={(e) =>
                    setEditing((s) => ({
                      ...s,
                      acc: { ...s.acc, currency: e.target.value.toUpperCase() },
                    }))
                  }
                />
                <select
                  className="chip"
                  value={editing.acc.status || "ACTIVE"}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, acc: { ...s.acc, status: e.target.value } }))
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <input
                  className="chip"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="APR %"
                  value={editing.acc.interestApr ?? 0}
                  onChange={(e) =>
                    setEditing((s) => ({
                      ...s,
                      acc: { ...s.acc, interestApr: e.target.value },
                    }))
                  }
                />
                <select
                  className="chip"
                  value={editing.acc.compounding || "MONTHLY"}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, acc: { ...s.acc, compounding: e.target.value } }))
                  }
                >
                  <option value="DAILY">DAILY</option>
                  <option value="MONTHLY">MONTHLY</option>
                </select>
                <select
                  className="chip"
                  value={editing.acc.day_count_conversion || "ACT_365F"}
                  onChange={(e) =>
                    setEditing((s) => ({
                      ...s,
                      acc: { ...s.acc, day_count_conversion: e.target.value },
                    }))
                  }
                >
                  <option value="ACT_365F">ACT_365F</option>
                </select>
              </div>

              <textarea
                className="chip"
                rows={3}
                placeholder="Notes"
                value={editing.acc.notes || ""}
                onChange={(e) =>
                  setEditing((s) => ({ ...s, acc: { ...s.acc, notes: e.target.value } }))
                }
              />

              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Tip: To change the balance, use Deposit, Withdraw or Transfer. Currency changes are
                only allowed when balance is zero (enforced by the server).
              </div>
            </div>

            <div className="confirm-actions">
              <button
                className="chip chip--ghost"
                disabled={busy}
                onClick={() => setEditing({ open: false, acc: null })}
              >
                Cancel
              </button>
              <button className="chip" disabled={busy} onClick={doEdit}>
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Toast ===== */}
      {toast.open && (
        <div className={`toast ${toast.kind === "err" ? "toast--error" : "toast--ok"}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
