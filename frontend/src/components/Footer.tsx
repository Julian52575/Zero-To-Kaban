import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-content">
        <p className="app-footer-copyright">
          © {new Date().getFullYear()} Zero-To-Kanban. All rights reserved.
        </p>

        <nav className="app-footer-links" aria-label="Legal links">
          <a href="/legal">Legal Notice</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Use</a>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
