import React from 'react';
import {
    Button,
    Form,
    Offcanvas,
    InputGroup,
    Alert,
} from 'react-bootstrap';

interface InviteCollaboratorProps {
    projectId: string;
}

function InviteCollaborator({
    projectId,
}: InviteCollaboratorProps) {
    const [show, setShow] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState(false);

    const handleClose = () => {
        if (submitting) {
            return;
        }

        setShow(false);
        setEmail('');
        setError('');
        setSuccess(false);
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (!email.trim()) {
            setError('Please enter an email address.');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess(false);

        try {
            /*
             * TODO:
             * Replace this with the actual API call when
             * the invitation endpoint is available.
             *
             * Example:
             *
             * await fetch(`/projects/${projectId}/invitations`, {
             *     method: 'POST',
             *     headers: {
             *         'Content-Type': 'application/json',
             *     },
             *     body: JSON.stringify({ email }),
             * });
             */

            console.log(
                'Inviting:',
                email,
                'to project:',
                projectId,
            );

            setSuccess(true);
            setEmail('');
        } catch {
            setError(
                'Unable to send the invitation. Please try again.',
            );
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
                    <Offcanvas.Title>
                        Invite a collaborator
                    </Offcanvas.Title>
                </Offcanvas.Header>

                <Form onSubmit={handleSubmit}>
                    <Offcanvas.Body>
                        {success && (
                            <Alert variant="success">
                                Invitation sent successfully.
                            </Alert>
                        )}

                        {error && (
                            <Alert variant="danger">
                                {error}
                            </Alert>
                        )}

                        <Form.Group
                            className="mb-3"
                            controlId="collaboratorEmail"
                        >
                            <Form.Label>
                                Collaborator's email
                            </Form.Label>

                            <InputGroup>
                                <InputGroup.Text>
                                    <i className="fa fa-envelope" />
                                </InputGroup.Text>

                                <Form.Control
                                    type="email"
                                    placeholder="user@example.com"
                                    value={email}
                                    onChange={event =>
                                        setEmail(
                                            event.target.value,
                                        )
                                    }
                                    disabled={submitting}
                                    required
                                />
                            </InputGroup>

                            <Form.Text className="text-muted">
                                Enter the email address of the user you
                                want to invite to this project.
                            </Form.Text>
                        </Form.Group>
                    </Offcanvas.Body>

                    <div className="border-top p-3">
                        <div className="d-grid gap-2">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={
                                    submitting || !email.trim()
                                }
                            >
                                {submitting
                                    ? 'Sending...'
                                    : 'Send invitation'}
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
