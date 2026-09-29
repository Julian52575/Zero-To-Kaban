import React from "react";
import { Button, Offcanvas, ListGroup, Badge } from "react-bootstrap";
import { useNotifications } from "../provider/useNotificationsProvider";

function NotificationCenter() {
  const [show, setShow] = React.useState(false);
  const { unreadNotifications, markAllAsRead } = useNotifications();
  const handleOpen = () => {
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    markAllAsRead();
  };

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
        onClick={handleOpen}
        aria-label="Open notifications"
        className="position-relative"
      >
        <i className="fa fa-bell" />

        {unreadNotifications.length > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle"
          >
            {unreadNotifications.length}
          </Badge>
        )}
      </Button>

      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="end"
        scroll={false}
        backdrop={true}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Notifications</Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="p-0">
          {unreadNotifications.length === 0 ? (
            <p className="text-center text-muted p-4 mb-0">No notifications.</p>
          ) : (
            <ListGroup variant="flush">
              {unreadNotifications.map((notification) => (
                <ListGroup.Item key={notification.id} className="py-3 px-3">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <strong>{notification.title}</strong>

                    <Badge bg="primary">
                        New
                    </Badge>
                  </div>

                  <p className="mb-0 mt-1 text-muted">{notification.message}</p>
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
