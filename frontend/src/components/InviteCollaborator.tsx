import React, { useEffect } from "react";
import { Button, Form, Offcanvas, Alert } from "react-bootstrap";
import Dropdown from "react-bootstrap/Dropdown";
import { getAllUsers } from "../services/collaboratorService";
import { inviteCollaborator } from "../services/ProjectApi";

interface InviteCollaboratorProps {
  projectId: string;
}

function InviteCollaborator({ projectId }: InviteCollaboratorProps) {
  const [show, setShow] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [selectedCollaborators, setSelectedCollaborators] = React.useState<
    string[]
  >([]);
  const [collaborators, setCollaborators] = React.useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    // Fetch collaborators from the backend
    const fetchCollaborators = async () => {
      try {
        const users = await getAllUsers();
        setCollaborators(
          users.map((user) => ({ id: user.id, name: user.pseudo })),
        );
      } catch (error) {
        console.error("Error fetching collaborators:", error);
      }
    };

    fetchCollaborators();
  }, []);

  const handleClose = () => {
    if (submitting) {
      return;
    }

    setShow(false);
    setSelectedCollaborators([]);
    setError("");
    setSuccess(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      for (const collaboratorId of selectedCollaborators) {
        await inviteCollaborator(projectId, collaboratorId);
      }
      setSuccess(true);
      setSelectedCollaborators([]);
    } catch {
      setError("Unable to send the invitation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setShow(true)}
        aria-label="Invite collaborator"
      >
        <i className="fa fa-user-plus me-2" />
        Invite
      </Button>

      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="end"
        scroll={false}
        backdrop={true}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Invite a collaborator</Offcanvas.Title>
        </Offcanvas.Header>

        <Form onSubmit={handleSubmit}>
          <Offcanvas.Body>
            {success && (
              <Alert variant="success">Invitation sent successfully.</Alert>
            )}

            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3" controlId="collaboratorEmail">
              <Form.Label>Collaborators list</Form.Label>

              <Dropdown className="w-100">
                <Dropdown.Toggle
                  variant="outline-secondary"
                  className="w-100 text-start"
                >
                  {selectedCollaborators.length === 0
                    ? "Sélectionner des collaborateurs"
                    : `${selectedCollaborators.length} collaborateur(s) sélectionné(s)`}
                </Dropdown.Toggle>

                <Dropdown.Menu className="w-100 p-2">
                  {collaborators.map((user) => (
                    <Dropdown.Item
                      as="label"
                      key={user.id}
                      className="d-flex align-items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedCollaborators.includes(user.id)}
                        onChange={() => {
                          setSelectedCollaborators((current) =>
                            current.includes(user.id)
                              ? current.filter((id) => id !== user.id)
                              : [...current, user.id],
                          );
                        }}
                      />

                      {user.name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              <Form.Text className="text-muted">
                Enter the email address of the user you want to invite to this
                project.
              </Form.Text>
            </Form.Group>
          </Offcanvas.Body>

          <div className="border-top p-3">
            <div className="d-grid gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={submitting || selectedCollaborators.length === 0}
              >
                {submitting ? "Sending..." : "Send invitation"}
              </Button>

              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Form>
      </Offcanvas>
    </>
  );
}

export default InviteCollaborator;
