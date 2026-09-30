import React from "react";
import AddItemForm from "./AddItemForm";
import KanbanBoard from "./KanbanBoard";
import type { ItemStatus } from "../types/item";
import type { Task, UpdateTaskInput } from "../types/task";
import {
  getTasks,
  moveTask,
  updateTask,
  deleteTask,
} from "../services/taskService";
import { type Column } from "../services/columnService";
import { getErrorMessage } from "../utils/errorMessage";
import { getProject, leaveProject } from "../services/ProjectApi";
import InviteCollaborator from "./InviteCollaborator";
import { Button } from "react-bootstrap";
import Swal from "sweetalert2";

const STATUSES: ItemStatus[] = ["todo", "doing", "done"];

function TodoList({ projectId }: { projectId: string }) {
  const [items, setItems] = React.useState<Task[] | null>(null);
  const [columns, setColumns] = React.useState<Column[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [ownerId, setOwnerid] = React.useState<string>("");
  const [permissions, setPermissions] = React.useState<{
    role: "OWNER" | "EDITOR" | "VIEWER";
    isOwner: boolean;
    canEdit: boolean;
    canManage: boolean;
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([getProject(projectId), getTasks(projectId)])
      .then(([project, tasks]) => {
        if (cancelled) return;
        const cols = project.columns ?? [];
        setColumns(cols);
        setPermissions({
          role: project.role,
          isOwner: project.isOwner,
          canEdit: project.canEdit,
          canManage: project.canManage,
        });
        setOwnerid(project.ownerId);
        setItems(
          tasks.map((t) => {
            const index = cols.findIndex((c: Column) => c.id === t.columnId);
            const status: ItemStatus = STATUSES[index] ?? "todo";
            return { ...t, status, completed: status === "done" };
          }),
        );
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const onNewItem = React.useCallback((newItem: Task) => {
    setItems((current) =>
      current === null ? [newItem] : [...current, newItem],
    );
  }, []);

  const replaceItem = React.useCallback((item: Task) => {
    setItems((current) =>
      current === null
        ? null
        : current.map((i) => (i.id === item.id ? item : i)),
    );
  }, []);

  const onItemUpdate = React.useCallback(
    (item: Task, changes: Partial<Task>) => {
      const {
        title,
        description,
        order,
        dueDate,
        priority,
        columnId,
        assigneeId,
      } = changes;
      const payload: UpdateTaskInput = {
        title,
        description,
        order,
        dueDate,
        priority,
        columnId,
        assigneeId,
      };
      setActionError(null);
      replaceItem({ ...item, ...changes });
      updateTask(projectId, item.id, payload).catch((err) => {
        console.error(err);
        replaceItem(item); // rollback
        setActionError(getErrorMessage(err));
      });
    },
    [projectId, replaceItem],
  );

  const onItemDelete = React.useCallback(
    (item: Task) => {
      setActionError(null);
      deleteTask(projectId, item.id)
        .then(() =>
          setItems((current) =>
            current === null ? null : current.filter((i) => i.id !== item.id),
          ),
        )
        .catch((err) => {
          console.error(err);
          setActionError(getErrorMessage(err));
        });
    },
    [projectId],
  );

  const onStatusChange = React.useCallback(
    (item: Task, status: ItemStatus) => {
      const target = columns[STATUSES.indexOf(status)];
      if (!target) return;

      setActionError(null);
      replaceItem({ ...item, status, completed: status === "done" }); // optimiste

      // position = fin de la colonne cible
      const order = (items ?? []).filter((i) => i.status === status).length;

      moveTask(projectId, item.id, target.id, order).catch((err) => {
        console.error(err);
        replaceItem(item); // rollback
        setActionError(getErrorMessage(err));
      });
    },
    [columns, items, projectId, replaceItem],
  );

  const handleLeaveProject = React.useCallback(async () => {
    const rep = await Swal.fire({
      title: "Left Project",
      text: "Are you sure you want to leave this project? You will lose access to it.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, leave",
      cancelButtonText: "Cancel",
    });
    if (!rep.isConfirmed) {
      return;
    }
    leaveProject(projectId)
      .then((result) => {
        if (result === "OWNER") {
          setActionError(
            "You are the owner of the project and cannot leave it.",
          );
        } else {
          window.location.href = "/";
        }
      })
      .catch((err) => {
        console.error(err);
        setActionError(getErrorMessage(err));
      });
  }, [projectId]);

  if (error !== null) {
    return <p className="text-center text-danger">{error}</p>;
  }
  if (items === null) {
    return <p className="text-center">Loading...</p>;
  }

  return (
    <React.Fragment>
      <div className="d-flex flex-nowrap align-items-start gap-3 mb-3">
        {permissions?.canEdit && (
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <AddItemForm
              projectId={projectId}
              columnId={columns[0]?.id}
              onNewItem={onNewItem}
            />
          </div>
        )}
        <div className="d-flex gap-2 flex-shrink-0">
          {permissions?.canManage && (
            <InviteCollaborator projectId={projectId} ownerId={ownerId} />
          )}
          {permissions && !permissions.isOwner && (
            <Button variant="danger" onClick={handleLeaveProject}>
              Leave Project
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-danger">{error}</p>}
      {actionError && <p className="text-danger">{actionError}</p>}
      <KanbanBoard
        items={items}
        projectId={projectId}
        onItemUpdate={onItemUpdate}
        onItemDelete={onItemDelete}
        onStatusChange={onStatusChange}
      />
    </React.Fragment>
  );
}

export default TodoList;
