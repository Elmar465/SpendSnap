import { Link } from "react-router-dom";
import "../styles/Landing.css";

const Landing = () => (
  <div className="landing-bg">
    <div className="landing-card">
      <h1>
        Welcome to <span>SpendSnap</span>
      </h1>
      <p>
        Your world-class expense tracker.<br />
        Manage, visualize, and dominate your spending habits!
      </p>
      <div className="landing-actions">
        <Link to="/login" className="landing-btn">Login</Link>
        <Link to="/register" className="landing-btn secondary">Register</Link>
      </div>
    </div>
  </div>
);

export default Landing;
