import React, { useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { Item, ItemStatus } from "../types/item";
import ItemDisplay from "./ItemDisplay";
import "./KanbanBoard.css";
import { Task } from "../types/task";
import { getProjectCollaborators } from "../services/ProjectApi";

const COLUMNS: { id: ItemStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "doing", title: "Doing" },
  { id: "done", title: "Done" },
];

export function getStatus(item: Task): ItemStatus {
  if (item.status) return item.status;
  return item.completed ? "done" : "todo";
}

interface KanbanBoardProps {
  items: Task[];
  projectId: string;
  onItemUpdate: (item: Task, changes: Partial<Task>) => void;
  onItemDelete: (item: Task) => void;
  onStatusChange: (item: Task, status: ItemStatus) => void;
}

function KanbanCard({
  item,
  members,
  onItemDelete,
  onItemUpdate,
}: {
  item: Task;
  members: { id: string; pseudo: string }[];
  onItemDelete: (item: Task) => void;
  onItemUpdate?: (item: Task, changes: Partial<Task>) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-card${isDragging ? " is-dragging" : ""}`}
    >
      <button
        type="button"
        className="kanban-handle"
        aria-label={`Déplacer "${item.title}"`}
        {...listeners}
        {...attributes}
      >
        ⠿
      </button>

      <div className="kanban-card-body">
        <ItemDisplay
          item={item}
          members={members}
          onDelete={onItemDelete}
          onUpdate={onItemUpdate}
        />
      </div>
    </div>
  );
}

function KanbanColumn({
  id,
  title,
  count,
  children,
}: {
  id: ItemStatus;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column kanban-column-${id}${isOver ? " is-over" : ""}`}
      aria-label={title}
    >
      <header className="kanban-column-header">
        <h2>{title}</h2>
        <span className="kanban-count">{count}</span>
      </header>
      <div className="kanban-column-body">
        {count === 0 && <p className="kanban-empty">Drag tasks here</p>}
        {children}
      </div>
    </section>
  );
}

function KanbanBoard({
  items,
  projectId,
  onItemUpdate,
  onItemDelete,
  onStatusChange,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = React.useState<Item["id"] | null>(null);
  const [members, setMembers] = React.useState<
    { id: string; pseudo: string }[]
  >([]);
  useEffect(() => {
    getProjectCollaborators(projectId)
      .then((collaborators) => {
        setMembers(collaborators);
      })
      .catch((error) => {
        console.error("Failed to fetch project collaborators:", error);
      });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const activeItem = React.useMemo(
    () => items.find((i) => i.id === activeId) ?? null,
    [items, activeId],
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as Item["id"]);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const item = items.find((i) => i.id === active.id);
    const newStatus = over.id as ItemStatus;
    if (!item || getStatus(item) === newStatus) return;

    onStatusChange(item, newStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="kanban-board">
        {COLUMNS.map((column) => {
          const columnItems = items.filter((i) => getStatus(i) === column.id);
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              count={columnItems.length}
            >
              {columnItems.map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  members={members}
                  onItemUpdate={onItemUpdate}
                  onItemDelete={onItemDelete}
                />
              ))}
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeItem && (
          <div className="kanban-card is-overlay">
            <span className="kanban-handle" aria-hidden="true">
              ⠿
            </span>
            <div className="kanban-card-body">{activeItem.title}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default KanbanBoard;
