import React from 'react';
import {
    Button,
    Modal,
    ListGroup,
    Badge,
} from 'react-bootstrap';

interface Notification {
    id: number;
    title: string;
    message: string;
    read: boolean;
}

function NotificationCenter() {
    const [show, setShow] = React.useState(false);

    // Temporary notifications. Put list of notification here.
    const [notifications] = React.useState<Notification[]>([
        {
            id: 1,
            title: 'Welcome',
            message: 'This is a temporary brut notification',
            read: false,
        },
        {
            id: 2,
            title: 'New activity',
            message: 'This is a temporary brut notification',
            read: false,
        },
    ]);

    const unreadCount = notifications.filter(
        notification => !notification.read,
    ).length;

    return (
        <>
            <Button
                variant="outline-secondary"
                onClick={() => setShow(true)}
                aria-label="Open notifications"
                className="position-relative"
            >
                <i className="fa fa-bell" />

                {unreadCount > 0 && (
                    <Badge
                        bg="danger"
                        pill
                        className="position-absolute top-0 start-100 translate-middle"
                    >
                        {unreadCount}
                    </Badge>
                )}
            </Button>

            <Modal
                show={show}
                onHide={() => setShow(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Notifications
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="p-0">
                    {notifications.length === 0 ? (
                        <p className="text-center text-muted p-4 mb-0">
                            No notifications.
                        </p>
                    ) : (
                        <ListGroup variant="flush">
                            {notifications.map(notification => (
                                <ListGroup.Item
                                    key={notification.id}
                                >
                                    <div className="d-flex justify-content-between">
                                        <strong>
                                            {notification.title}
                                        </strong>

                                        {!notification.read && (
                                            <Badge bg="primary">
                                                New
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="mb-0 mt-1 text-muted">
                                        {notification.message}
                                    </p>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default NotificationCenter;
