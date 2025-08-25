import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  const nav = useNavigate();
  const { key: routeKey } = useLocation();

  const [authed, setAuthed] = useState(!!sessionStorage.getItem("token"));
  const [username, setUsername] = useState(sessionStorage.getItem("username") || "");
  const [open, setOpen] = useState(false);
  const [masked, setMasked] = useState(sessionStorage.getItem("maskAmounts") === "1");
  const menuRef = useRef(null);

  // Re-evaluate auth state on every route change
  useEffect(() => {
    setAuthed(!!sessionStorage.getItem("token"));
    setUsername(sessionStorage.getItem("username") || "");
    setOpen(false);
  }, [routeKey]);

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    const onEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  // Keep toggle state in sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "maskAmounts") setMasked(sessionStorage.getItem("maskAmounts") === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const logout = () => {
    sessionStorage.clear();
    nav("/login", { replace: true });
  };

  const initials = (username || "U").trim().slice(0, 2).toUpperCase();

  const toggleMask = () => {
    const next = !masked;
    setMasked(next);
    sessionStorage.setItem("maskAmounts", next ? "1" : "0");
    // broadcast change to other tabs and components
    window.dispatchEvent(new StorageEvent("storage", { key: "maskAmounts" }));
  };

  const linkClass = ({ isActive }) => `nav__link${isActive ? " is-active" : ""}`;
  const btnClass = ({ isActive }) => `nav__btn${isActive ? " is-active" : ""}`;

  return (
    <header className="nav" role="banner">
      <nav className="nav__inner" aria-label="Global">
        {/* Brand */}
        <button
          className="nav__brand"
          onClick={() => nav(authed ? "/dashboard" : "/")}
          title="SpendSnap"
        >
          <span className="nav__logo" aria-hidden="true">S$</span>
          <span className="nav__title">SpendSnap</span>
        </button>

        {/* LEFT links */}
        <div className="nav__links" role="navigation" aria-label="Primary">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>

          {authed && (
            <>
              <NavLink to="/add" className={linkClass}>
                Add Expense
              </NavLink>
              <NavLink to="/add-income" className={linkClass}>
                Add Income
              </NavLink>
              <NavLink to="/saving-accounts" className={linkClass}>
                Savings
              </NavLink>
              {/* FX link removed per your request */}
            </>
          )}
        </div>

        {/* RIGHT side */}
        <div className="nav__actions">
          {authed && (
            <button
              className={`nav__mask ${masked ? "is-on" : ""}`}
              onClick={toggleMask}
              title={masked ? "Show amounts" : "Hide amounts"}
              type="button"
            >
              {masked ? "🙈 Hidden" : "👀 Visible"}
            </button>
          )}

          {authed ? (
            <div className="nav__profile" ref={menuRef}>
              <button
                className="nav__profileBtn"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls="navProfileMenu"
              >
                <span className="nav__avatar" aria-hidden="true">{initials}</span>
                <span className="nav__username" title={username}>{username}</span>
                <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {open && (
                <div id="navProfileMenu" className="nav__menu" role="menu">
                  <button className="nav__menuItem" role="menuitem" onClick={() => { setOpen(false); /* future profile */ }}>
                    Profile <span className="nav__hint">(soon)</span>
                  </button>

                  <button
                    className="nav__menuItem"
                    role="menuitem"
                    onClick={() => { setOpen(false); nav("/contact"); }}
                  >
                    Contact
                  </button>

                  <button className="nav__menuItem nav__menuItem--danger" role="menuitem" onClick={logout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav__auth">
              <NavLink to="/login" className={btnClass}>
                Login
              </NavLink>
              <NavLink to="/register" className="nav__btn nav__btn--primary">
                Register
              </NavLink>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
