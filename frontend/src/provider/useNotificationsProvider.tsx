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
  type: string;
  title: string;
  message: string;
  projectId?: string;
  collaboratorId?: string;
};

type NotificationContextType = {
  unreadNotifications: Notification[];
  markAllTaskAsRead: () => void;
  resolveNotification: (id: string) => void;
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
      case "task.assigned.v1": {
        const task = data as { title: string };
        addNotification({
          id: eventId,
          type: "task",
          title: "Task assigned",
          message: `You were assigned to task "${task.title}".`,
        });
        break;
      }

      case "project.invitation.v1": {
        const invitation = data as { projectId: string; userId: string };
        addNotification({
          id: eventId,
          projectId: invitation.projectId,
          collaboratorId: invitation.userId,
          type: "invitation",
          title: "Project invitation",
          message: `You have been invited to a project.`,
        });
        break;
      }

      default:
        console.log("Unknown notification type:", type);
    }
  });

  useEffect(() => {
    const getNoReadNotifications = async () => {
      const rep = await fetchUnreadNotifications();
      setUnreadNotifications(
        rep.map((n) => {
          const isTask = n.type === "task.assigned.v1";
          const d = n.data as {
            title?: string;
            projectId?: string;
            userId?: string;
          };

          return {
            id: n.id,
            type: isTask ? "task" : "invitation",
            title: isTask ? "Task assigned" : "Project invitation",
            message: isTask
              ? `You were assigned to "${d.title}".`
              : `You have been invited to a project.`,
            projectId: d.projectId,
            collaboratorId: d.userId,
          };
        }),
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

  function markAllTaskAsRead() {
    const taskIds = unreadNotifications
      .filter((n) => n.type === "task")
      .map((n) => n.id);
    setUnreadNotifications((current) =>
      current.filter((n) => n.type !== "task"),
    );
    taskIds.forEach((id) =>
      markNotificationAsRead(id).catch((err) =>
        console.error("Failed to mark notification as read:", err),
      ),
    );
  }

  // Retire une notification (ex. invitation acceptée/refusée) et la marque comme lue
  function resolveNotification(id: string) {
    setUnreadNotifications((current) => current.filter((n) => n.id !== id));
    markNotificationAsRead(id).catch((err) =>
      console.error("Failed to mark notification as read:", err),
    );
  }

  function dismissToast(id: string) {
    setNotifications((current) => current.filter((n) => n.id !== id));
  }

  return (
    <NotificationContext.Provider
      value={{ unreadNotifications, markAllTaskAsRead, resolveNotification }}
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
