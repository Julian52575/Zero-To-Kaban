import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Button, ListGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { getProjects, deleteProject, createProject } from "../services/ProjectApi";
import type { Project } from "../types/Project";

import UserProfileButton from './../components/UserProfile/UserProfileButton';

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setError(null);
    getProjects()
      .then((data) => setProjects(data))
      .catch((error) => {
        console.error("Error retrieving projects:", error);
        setError("Unable to retrieve the projects. Please try again later.");
      });
  }, []);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createProject(trimmed)
      .then((createdProject) => {
        setProjects([...projects, createdProject]);
        setName("");
      })
      .catch((error) => {
        console.error("Error while creating the project:", error);
        setError("Unable to create the project. Please try again later.");
      });
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation(); 
    if (!window.confirm("Delete ce projet et toutes ses tâches ?")) return;
    deleteProject(id)
      .then(() => {
        setProjects(projects.filter((p) => p.id !== id));
      })
      .catch((error) => {
        console.error("Error while deleting the project:", error);
        setError("Unable to delete the project. Please try again later.");
      });
  };

  if (error) {
    return (
      <Container className="py-4">
        <Row>
          <Col md={{ offset: 3, span: 6 }}>
            <p className="text-danger">{error}</p>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <UserProfileButton />
      <Row>
        <Col md={{ offset: 3, span: 6 }}>
          <h2 className="mb-4">My projects</h2>

          <Form onSubmit={handleCreate} className="d-flex gap-2 mb-4">
            <Form.Control
              type="text"
              placeholder="Name of the new project"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" variant="primary">
              Create
            </Button>
          </Form>

          {projects.length === 0 ? (
            <p className="text-muted">No projects at the moment.</p>
          ) : (
            <ListGroup>
              {projects.map((project) => (
                <ListGroup.Item
                  key={project.id}
                  as="div"
                  action
                  role="button"
                  className="d-flex justify-content-between align-items-center"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <span>{project.name}</span>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={(e) => handleDelete(e, project.id)}
                  >
                    Delete
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Projects;
