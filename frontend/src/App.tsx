import { Routes, Route, Navigate } from "react-router-dom";
import Kanban from "./routes/Kanban";
import Projects from "./routes/Projects";
import { NotificationProvider } from "./provider/useNotificationsProvider";

function App() {
  return (
    <NotificationProvider position="bottom-end" delay={6000}>
      <Routes>
        <Route path="/" element={<Projects />} />
        <Route path="/projects/:projectId" element={<Kanban />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NotificationProvider>
  );
}

export default App;
