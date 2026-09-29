import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import { useWebSocket } from "../hooks/useWebSocket";
import {
  fetchUnreadNotifications,
  markNotificationAsRead,
} from "../services/notificationService";

type Notification = {
  id: string;
  title: string;
  message: string;
};

type NotificationContextType = {
  unreadNotifications: Notification[];
  markAllAsRead: () => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({
  position = "bottom-end",
  delay = 5000,
  children,
}: {
  position?:
    | "top-start"
    | "top-center"
    | "top-end"
    | "bottom-start"
    | "bottom-center"
    | "bottom-end";
  delay?: number;
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<
    Notification[]
  >([]);

  useWebSocket((type, data, eventId) => {
    switch (type) {
      case "task.assigned.v1":
        const notificationIndex = data as {
          id: string;
          data: { title: string };
        };
        addNotification({
          id: notificationIndex.id,
          title: "Task assigned",
          message: `You were assigned to task "${(data as { title: string }).title}".`,
        });
        break;

      case "project.invitation.v1":
        const notificationIndex2 = data as { id: string };
        addNotification({
          id: notificationIndex2.id,
          title: "Project invitation",
          message: `You have been invited to a project.`,
        });
        break;

      default:
        console.log("Unknown notification type:", type);
    }
  });

  useEffect(() => {
    const getNoReadNotifications = async () => {
      const rep = await fetchUnreadNotifications();
      setUnreadNotifications(
        rep.map((n) => ({
          id: n.id,
          title:
            n.type === "task.assigned.v1"
              ? "Task assigned"
              : "Project invitation",
          message:
            n.type === "task.assigned.v1"
              ? `You were assigned to "${(n.data as { title: string }).title}".`
              : `You have been invited to a project.`,
        })),
      );
    };

    getNoReadNotifications();
  }, []);

  function addNotification(notification: Notification) {
    setNotifications((current) => [...current, notification]);
    setUnreadNotifications((current) =>
      current.some((n) => n.id === notification.id)
        ? current
        : [notification, ...current],
    );
  }

  function markAllAsRead() {
    const ids = unreadNotifications.map((n) => n.id);
    setUnreadNotifications([]);
    ids.forEach((id) =>
      markNotificationAsRead(id).catch((err) =>
        console.error("Failed to mark notification as read:", err),
      ),
    );
  }

  function dismissToast(id: string) {
    setNotifications((current) => current.filter((n) => n.id !== id));
  }

  function removeNotification(id: string) {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    );
    markNotificationAsRead(id).catch((err) => {
      console.error("Failed to mark notification as read:", err);
    });
  }

  return (
    <NotificationContext.Provider
      value={{ unreadNotifications, markAllAsRead }}
    >
      {children}

      <ToastContainer
        position={position}
        className="p-3"
        style={{ zIndex: 9999 }}
      >
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            onClose={() => dismissToast(notification.id)}
            delay={delay}
            autohide
          >
            <Toast.Header>
              <strong className="me-auto">{notification.title}</strong>

              <small>just now</small>
            </Toast.Header>

            <Toast.Body>{notification.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  }

  return context;
}
