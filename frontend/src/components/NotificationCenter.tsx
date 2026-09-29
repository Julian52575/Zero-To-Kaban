import React from 'react';
import {
    Button,
    Offcanvas,
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

    // Temporary notifications. Put list of notifications here.
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
            <style>{`
                .position-relative {
                        margin-left: auto;
                        border-radius: 8px;
                        font-weight: 600;
                        color: #fff;
                        background-color: #198754;
                        border: none;
                        margin : 5px;
                    }

                .position-relative:hover {
                    background-color: #146c43;
                    transform: scale(1.02);
                    transition: transform 0.2s ease-in-out;
                }
            `}</style>
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

            <Offcanvas
                show={show}
                onHide={() => setShow(false)}
                placement="end"
                scroll={false}
                backdrop={true}
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        Notifications
                    </Offcanvas.Title>
                </Offcanvas.Header>

                <Offcanvas.Body className="p-0">
                    {notifications.length === 0 ? (
                        <p className="text-center text-muted p-4 mb-0">
                            No notifications.
                        </p>
                    ) : (
                        <ListGroup variant="flush">
                            {notifications.map(notification => (
                                <ListGroup.Item
                                    key={notification.id}
                                    className="py-3 px-3"
                                >
                                    <div className="d-flex justify-content-between align-items-start gap-2">
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
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}

export default NotificationCenter;