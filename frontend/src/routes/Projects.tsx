import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Button, ListGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
  getProjects,
  deleteProject,
  createProject,
} from "../services/ProjectApi";
import type { Project } from "../types/Project";

import UserProfileButton from "./../components/UserProfile/UserProfileButton";
import NotificationCenter from "../components/NotificationCenter";

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setError(null);
    getProjects()
      .then((data) => {
        setProjects(data);
      })
      .catch((error) => {
        console.error("Error retrieving projects:", error);
        if (Array.isArray(error) && error.length > 0 && error[0].message) {
          setError(error[0].message);
        } else {
          setError("Unable to retrieve the projects. Please try again later.");
        }
      });
  }, []);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed.length < 2) {
      setError("Project name must be at least 2 characters long.");
      return;
    }
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

  const handleDelete = async (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) {
      return;
    }
    deleteProject(id)
      .then(() => {
        setProjects(projects.filter((p) => p.id !== id));
      })
      .catch((error) => {
        console.error("Error while deleting the project:", error);
        setError("Unable to delete the project. Please try again later.");
      });
  };

  return (
    <Container className="py-4">
      <NotificationCenter />
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
            <Button
              type="submit"
              variant="primary"
              disabled={!name.trim() || name.trim().length < 2}
            >
              Create
            </Button>
          </Form>
          {error && <p className="text-danger">{error}</p>}

          {projects.length === 0  && !error ? (
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
                  <span>
                    {project.name}
                    {project.isOwner && " (Owner)"}
                  </span>
                  {project.isOwner && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={async (e) =>await handleDelete(e, project.id)}
                    >
                      Delete
                    </Button>
                  )}
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
