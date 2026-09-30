import React, { useEffect } from "react";
import { Button, Form, Offcanvas, Alert } from "react-bootstrap";
import Select, { MultiValue } from "react-select";
import { getAllUsers } from "../services/collaboratorService";
import {
  getProjectCollaborators,
  inviteCollaborator,
} from "../services/ProjectApi";

interface InviteCollaboratorProps {
  projectId: string;
  ownerId: string;
}

interface CollaboratorOption {
  value: string;
  label: string;
}

function InviteCollaborator({ projectId, ownerId }: InviteCollaboratorProps) {
  const [show, setShow] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [selectedCollaborators, setSelectedCollaborators] = React.useState<
    CollaboratorOption[]
  >([]);
  const [options, setOptions] = React.useState<CollaboratorOption[]>([]);
  const loadOptions = React.useCallback(async () => {
    try {
      const [users, collaborators] = await Promise.all([
        getAllUsers(),
        getProjectCollaborators(projectId),
      ]);

      // Propriétaire (toi) + tous ceux qui ont déjà une ligne dans le projet
      const excluded = new Set<string>(collaborators.map((c) => c.id));
      if (ownerId) excluded.add(ownerId);

      setOptions(
        users
          .filter((user) => !excluded.has(user.id))
          .map((user) => ({ value: user.id, label: user.pseudo })),
      );
    } catch (error) {
      console.error("Error fetching collaborators:", error);
    }
  }, [projectId, ownerId]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const handleClose = () => {
    if (submitting) return;

    setShow(false);
    setSelectedCollaborators([]);
    setError("");
    setSuccess(false);
  };

  const handleChange = (selected: MultiValue<CollaboratorOption>) => {
    setSelectedCollaborators([...selected]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      for (const collaborator of selectedCollaborators) {
        await inviteCollaborator(projectId, collaborator.value);
      }
      setSuccess(true);
      setSelectedCollaborators([]);
      await loadOptions()
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

            <Form.Group className="mb-3" controlId="collaboratorSelect">
              <Form.Label>Collaborators list</Form.Label>

              <Select<CollaboratorOption, true>
                inputId="collaboratorSelect"
                isMulti
                options={options}
                value={selectedCollaborators}
                onChange={handleChange}
                closeMenuOnSelect={false}
                isDisabled={submitting}
                placeholder="Sélectionner des collaborateurs"
                noOptionsMessage={() => "Aucun collaborateur trouvé"}
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 2000 }),
                }}
              />

              <Form.Text className="text-muted">
                Select the users you want to invite to this project.
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
