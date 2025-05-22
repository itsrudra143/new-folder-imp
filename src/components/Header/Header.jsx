import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Header.css";

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="header-logo">Exam Matrix</Link>
        {isAuthenticated && (
          <nav className="header-nav">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            {isAdmin ? (
              <>
                <Link to="/create-test" className="nav-link">Create Test</Link>
                <Link to="/admin/classes" className="nav-link">Manage Classes</Link>
              </>
            ) : (
              <Link to="/student/classes" className="nav-link">My Classes</Link>
            )}
          </nav>
        )}
      </div>
      <div className="header-right">
        {isAuthenticated ? (
          <>
            <Link to="/profile" className="header-button secondary">Profile</Link>
            <button onClick={handleLogout} className="header-button primary">Log Out</button>
          </>
        ) : (
          <>
            <Link to="/signup" className="header-button secondary">Create Account</Link>
            <Link to="/login" className="header-button primary">Log In</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;