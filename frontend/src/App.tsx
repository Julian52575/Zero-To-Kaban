import { Routes, Route, Navigate } from "react-router-dom";
import Kanban from "./routes/Kanban";
import Projects from "./routes/Projects";
import Accessibility from "./routes/Accessibility";
import Footer from "./components/Footer";
import { NotificationProvider } from "./provider/useNotificationsProvider";
import "./index.css";

function App() {
  return (
    <NotificationProvider position="bottom-end" delay={6000}>
      <div className="app">
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Projects />} />
            <Route path="/projects/:projectId" element={<Kanban />} />
            <Route path="/accessibility" element={<Accessibility />} />
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
