// Footer.jsx
import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <p className="footer-title">Exam Matrix</p>
        <p className="copyright">
          © {new Date().getFullYear()} Exam Matrix. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
