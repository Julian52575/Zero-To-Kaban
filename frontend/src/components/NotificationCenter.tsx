import React from "react";
import { Button, Offcanvas, ListGroup, Badge } from "react-bootstrap";
import { useNotifications } from "../provider/useNotificationsProvider";
import { AcceptInvitation, declineInvitation } from "../services/ProjectApi";

function NotificationCenter() {
  const [show, setShow] = React.useState(false);
  const { unreadNotifications, markAllTaskAsRead, resolveNotification } =
    useNotifications();

  const handleOpen = () => {
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    markAllTaskAsRead();
  };

  const handleAccept = async (
    notificationId: string,
    projectId: string | undefined,
    collaboratorId: string | undefined,
  ) => {
    if (!projectId || !collaboratorId) {
      console.error(
        "Project ID or Collaborator ID is undefined.",
        projectId,
        collaboratorId,
      );
      return;
    }
    try {
      await AcceptInvitation(projectId, collaboratorId);
      resolveNotification(notificationId);
    } catch (error) {
      console.error("Error accepting invitation:", error);
    }
  };

   const handleDecline = async (
    notificationId: string,
    projectId: string | undefined,
    collaboratorId: string | undefined,
  ) => {
    if (!projectId || !collaboratorId) {
      console.error(
        "Project ID or Collaborator ID is undefined.",
        projectId,
        collaboratorId,
      );
      return;
    }
    try {
      await declineInvitation(projectId, collaboratorId);
      resolveNotification(notificationId);
    } catch (error) {
      console.error("Error declining invitation:", error);
    }
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
            {unreadNotifications.length < 10
              ? unreadNotifications.length
              : "9+"}
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

                    <Badge bg="primary">New</Badge>
                  </div>

                  <p className="mb-0 mt-1 text-muted">{notification.message}</p>
                  {notification.type === "invitation" && (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          handleAccept(
                            notification.id,
                            notification.projectId,
                            notification.collaboratorId,
                          )
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="mt-2 ms-2"
                        onClick={() => 
                            handleDecline(
                              notification.id,
                              notification.projectId,
                              notification.collaboratorId,
                            )
                        }
                      >
                        Decline
                      </Button>
                    </>
                  )}
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
