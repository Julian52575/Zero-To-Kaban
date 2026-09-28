import { Routes, Route, Navigate } from "react-router-dom";
import Kanban from "./routes/Kanban";
import Projects from "./routes/Projects";
import Accessibility from "./routes/Accessibility";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Projects />} />
      <Route path="/projects/:projectId" element={<Kanban />} />
      <Route path="/accessibility" element={<Accessibility />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
