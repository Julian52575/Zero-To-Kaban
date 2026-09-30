import { Routes, Route, Navigate } from "react-router-dom";
import Kanban from "./routes/Kanban";
import Projects from "./routes/Projects";
import Accessibility from "./routes/Accessibility";
import TermsOfUse from "./routes/TermsOfUse";
import PrivacyPolicy from "./routes/PrivacyPolicy";
import LegalNotice from "./routes/LegalNotice";
import Footer from "./components/Footer";
import { NotificationProvider } from "./provider/useNotificationsProvider";
import "./index.css";

function App() {
  return (
    <NotificationProvider position="bottom-end" delay={6000}>
      <div className="app">
        <header className="app-header">
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
        </header>
        <main id="main-content" className="app-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Projects />} />
            <Route path="/projects/:projectId" element={<Kanban />} />
            <Route path="/accessibility" element={<Accessibility />} />
            <Route path="/terms-of-use" element={<TermsOfUse />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/legal" element={<LegalNotice />} />
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </NotificationProvider>
  );
}

export default App;
