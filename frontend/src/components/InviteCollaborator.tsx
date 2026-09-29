import React from 'react';
import {
    Button,
    Form,
    Modal,
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

            console.log('Inviting:', email, 'to project:', projectId);

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

            <Modal
                show={show}
                onHide={handleClose}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Invite a collaborator
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
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

                        <Form.Group controlId="collaboratorEmail">
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
                                        setEmail(event.target.value)
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
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={handleClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>

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
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
}

export default InviteCollaborator;
