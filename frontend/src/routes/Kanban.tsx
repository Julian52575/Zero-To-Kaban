import { Container, Row, Col } from "react-bootstrap";
import TodoList from "../components/TodoList";
import { Navigate, useParams } from "react-router-dom";
import UserProfileButton from './../components/UserProfile/UserProfileButton';
import NotificationCenter from "../components/NotificationCenter";
import BackButton from "../components/BackButton";

function Kanban() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return <Navigate to="/" replace />;
  return (
    <Container>
      <h1 className="visually-hidden">Project board</h1>
      <BackButton />
      <NotificationCenter />
      <UserProfileButton />
      <Row>
        <Col md={{ offset: 3, span: 6 }}>
          <TodoList projectId={projectId} />
        </Col>
      </Row>
    </Container>
  );
}

export default Kanban;
