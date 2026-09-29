import React from 'react';
import {
    Alert,
    Button,
    Form,
    Offcanvas,
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
    const [password, setpassword] = React.useState('');

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
                setpassword(currentUser.password);
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
                password,
            });

            setUser(updatedUser);
            setUsername(updatedUser.username);
            setpassword(updatedUser.password);
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

            window.location.href = '/';
        } catch {
            setError('Unable to delete your account.');
            setShowDeleteConfirmation(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();

            window.location.href = '/';
        } catch {
            setError('Unable to logout.');
        }
    };

    return (
        <Offcanvas
            show={show}
            onHide={onClose}
            placement="end"
            scroll={false}
            backdrop={true}
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>
                    User profile
                </Offcanvas.Title>
            </Offcanvas.Header>

            <Offcanvas.Body>
                {error && (
                    <Alert variant="danger">
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <div className="text-center py-4">
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
                                    Password
                                </Form.Label>

                                <Form.Control
                                    type="password"
                                    value={password}
                                    onChange={event =>
                                        setpassword(
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
                                className="w-100"
                            >
                                {saving
                                    ? 'Saving...'
                                    : 'Save changes'}
                            </Button>
                        </Form>

                        <hr className="my-4" />

                        <div className="d-grid gap-2">
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

                                <div className="d-grid gap-2">
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
            </Offcanvas.Body>
        </Offcanvas>
    );
}

export default UserProfileModal;
