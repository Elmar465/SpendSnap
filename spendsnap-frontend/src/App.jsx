import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import AddIncome from "./pages/AddIncome";
import Dashboard from "./pages/Dashboard";
import AddExpense from "./pages/AddExpense";
import Landing from "./pages/Landing";
import Navbar from "./components/Navbar";
import SavingAccount from "./pages/SavingAccount"; // ⬅️ NEW

const isAuthed = () => !!sessionStorage.getItem("token");

const Protected = ({ children }) => {
  const location = useLocation();
  return isAuthed() ? children : <Navigate to="/login" replace state={{ from: location }} />;
};

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const hideNav = pathname === "/" || pathname === "/login" || pathname === "/register";
  return (
    <>
      {!hideNav && <Navbar />}
      {children}
    </>
  );
};

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={isAuthed() ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={isAuthed() ? <Navigate to="/dashboard" replace /> : <Register />} />

          {/* Private */}
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/add" element={<Protected><AddExpense /></Protected>} />
          <Route path="/add-income" element={<Protected><AddIncome /></Protected>} />
          <Route path="/saving-accounts" element={<Protected><SavingAccount /></Protected>} /> {/* ⬅️ NEW */}

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
