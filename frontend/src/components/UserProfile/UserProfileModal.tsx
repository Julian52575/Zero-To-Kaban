import React from 'react';
import {
    Alert,
    Button,
    Form,
    Modal,
    Spinner,
} from 'react-bootstrap';

import type { User } from '../../types/user';

import {
    getCurrentUser,
    updateUser,
    deleteUser,
    logout,
} from '../../services/userApi';

interface UserProfileModalProps {
    show: boolean;
    onClose: () => void;
}

function UserProfileModal({
    show,
    onClose,
}: UserProfileModalProps) {
    const [user, setUser] = React.useState<User | null>(null);
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');

    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [showDeleteConfirmation, setShowDeleteConfirmation] =
        React.useState(false);

    React.useEffect(() => {
        if (!show) {
            return;
        }

        setLoading(true);
        setError(null);

        getCurrentUser()
            .then(currentUser => {
                setUser(currentUser);
                setUsername(currentUser.username);
                setEmail(currentUser.email);
            })
            .catch(() => {
                setError('Unable to load your profile.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [show]);

    const handleSave = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (!user) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const updatedUser = await updateUser({
                ...user,
                username,
                email,
            });

            setUser(updatedUser);
            setUsername(updatedUser.username);
            setEmail(updatedUser.email);
        } catch {
            setError('Unable to update your profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!user) {
            return;
        }

        try {
            await deleteUser(user.id);

            // À adapter à ton système de navigation/authentification.
            window.location.href = '/';
        } catch {
            setError('Unable to delete your account.');
            setShowDeleteConfirmation(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();

            // À adapter à ton système de navigation.
            window.location.href = '/';
        } catch {
            setError('Unable to logout.');
        }
    };

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>User profile</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {error && (
                    <Alert variant="danger">
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <>
                        <Form onSubmit={handleSave}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Username
                                </Form.Label>

                                <Form.Control
                                    type="text"
                                    value={username}
                                    onChange={event =>
                                        setUsername(
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Email
                                </Form.Label>

                                <Form.Control
                                    type="email"
                                    value={email}
                                    onChange={event =>
                                        setEmail(
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                            </Form.Group>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Saving...'
                                    : 'Save changes'}
                            </Button>
                        </Form>

                        <hr />

                        <div className="d-flex justify-content-between">
                            <Button
                                variant="outline-secondary"
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>

                            <Button
                                variant="outline-danger"
                                onClick={() =>
                                    setShowDeleteConfirmation(true)
                                }
                            >
                                Delete account
                            </Button>
                        </div>

                        {showDeleteConfirmation && (
                            <Alert
                                variant="danger"
                                className="mt-3"
                            >
                                <Alert.Heading>
                                    Delete your account?
                                </Alert.Heading>

                                <p>
                                    This action is permanent and
                                    cannot be undone.
                                </p>

                                <div className="d-flex gap-2">
                                    <Button
                                        variant="danger"
                                        onClick={handleDelete}
                                    >
                                        Yes, delete my account
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            setShowDeleteConfirmation(
                                                false,
                                            )
                                        }
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </Alert>
                        )}
                    </>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={onClose}
                >
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default UserProfileModal;