import React from "react";
import AddItemForm from "./AddItemForm";
import KanbanBoard from "./KanbanBoard";
import type { Item, ItemStatus } from "../types/item";
import type { Task } from "../types/task";
import {
  getTasks,
  moveTask,
  updateTask,
  deleteTask,
} from "../services/taskService";
import { type Column } from "../services/columnService";
import { getErrorMessage } from "../utils/errorMessage";
import { getProject } from "../services/ProjectApi";
import InviteCollaborator from "./InviteCollaborator";
import { Button } from "react-bootstrap";

const STATUSES: ItemStatus[] = ["todo", "doing", "done"];

function taskToItem(task: Task, columns: Column[]): Item {
  const idx = columns.findIndex((c) => c.id === task.columnId);
  const status = STATUSES[Math.min(Math.max(idx, 0), STATUSES.length - 1)];
  return {
    id: task.id,
    name: task.title,
    completed: status === "done",
    status,
  };
}

function TodoList({ projectId }: { projectId: string }) {
  const [items, setItems] = React.useState<Item[] | null>(null);
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
        setItems(tasks.map((t) => taskToItem(t, cols)));
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const onNewItem = React.useCallback((newItem: Item) => {
    setItems((current) =>
      current === null ? [newItem] : [...current, newItem],
    );
  }, []);

  const replaceItem = React.useCallback((item: Item) => {
    setItems((current) =>
      current === null
        ? null
        : current.map((i) => (i.id === item.id ? item : i)),
    );
  }, []);

  const onItemRename = React.useCallback(
    (item: Item, name: string) => {
      const trimmed = name.trim();
      if (!trimmed || trimmed === item.name) return;

      setActionError(null);
      replaceItem({ ...item, name: trimmed }); // optimiste
      updateTask(projectId, item.id, { title: trimmed }).catch((err) => {
        console.error(err);
        replaceItem(item); // rollback
        setActionError(getErrorMessage(err));
      });
    },
    [projectId, replaceItem],
  );

  const onItemDelete = React.useCallback(
    (item: Item) => {
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
    (item: Item, status: ItemStatus) => {
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

  if (error !== null) {
    return <p className="text-center text-danger">{error}</p>;
  }
  if (items === null) {
    return <p className="text-center">Chargement…</p>;
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
            <Button variant="danger">Quitter</Button>
          )}
        </div>
      </div>
      {actionError && <p className="text-danger">{actionError}</p>}
      <KanbanBoard
        items={items}
        onItemRename={onItemRename}
        onItemDelete={onItemDelete}
        onStatusChange={onStatusChange}
      />
    </React.Fragment>
  );
}

export default TodoList;
