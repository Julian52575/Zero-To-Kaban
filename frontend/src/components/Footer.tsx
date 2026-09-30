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
          <a href="/terms-of-use">Terms of Use</a>
          <a href="/accessibility">Accessibility</a>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
