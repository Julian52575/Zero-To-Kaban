import React from "react";
import { Badge, Button, Form, InputGroup } from "react-bootstrap";
import type { Item } from "../types/item";
import TaskDetailsModal from "./TaskDetailsModal";
import Select, { SingleValue } from "react-select";
import { Task } from "../types/task";

interface AssigneeOption {
  value: string;
  label: string;
}

type Priority = "HIGH" | "MEDIUM" | "LOW";

type Member = { id: string; pseudo: string };

interface Props {
  item: Task;
  onDelete: (item: Task) => void;
  onUpdate?: (item: Task, changes: Partial<Task>) => void;
  members?: Member[];
  canEdit?: boolean; 
}

const PRIORITY_META: Record<
  Priority,
  { label: string; bg: string; text?: string }
> = {
  HIGH: { label: "High", bg: "danger" },
  MEDIUM: { label: "Medium", bg: "warning", text: "dark" },
  LOW: { label: "Low", bg: "secondary" },
};

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ItemDisplay({
  item,
  onDelete,
  onUpdate,
  members = [],
  canEdit = true,
}: Props) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(item.title);
  const [showDetails, setShowDetails] = React.useState(false);

  const priority = item.priority as Priority | undefined;
  const dueDate = parseDate(item.dueDate);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isOverdue =
    dueDate !== null && dueDate < startOfToday && !item.completed;

  const startEditing = () => {
    if (!canEdit) return;
    setDraft(item.title);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(item.title);
    setEditing(false);
  };

  const save = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setEditing(false);
    onUpdate?.(item, { title: trimmed });
  };

  const handleDetailsSave = (currentItem: Task, changes: Partial<Task>) => {
    if (onUpdate) {
      onUpdate(currentItem, changes);
    }
    if (changes.title && changes.title !== currentItem.title) {
      onUpdate?.(currentItem, { title: changes.title });
    }
  };

  const assigneeOptions: AssigneeOption[] = members.map((m) => ({
    value: m.id,
    label: m.pseudo,
  }));

  const selectedAssignee: AssigneeOption | null = item.assigneeId
    ? (assigneeOptions.find((o) => o.value === item.assigneeId) ?? {
        value: item.assigneeId,
        label: "Ancien membre",
      })
    : null;

  const handleAssign = (option: SingleValue<AssigneeOption>) => {
    onUpdate?.(item, { assigneeId: option?.value ?? null });
  };

  if (editing) {
    return (
      <InputGroup size="sm">
        <Form.Control
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
        />
        <Button variant="success" onClick={save}>
          OK
        </Button>
      </InputGroup>
    );
  }

  // L'assigné peut ne plus être dans la liste (collaborateur retiré) : on le garde visible
  const assigneeId = item.assigneeId ?? "";
  const assigneeKnown =
    assigneeId === "" || members.some((m) => m.id === assigneeId);

  return (
    <>
      <div
        role="presentation"
        className="d-flex flex-column gap-2"
        onClick={() => setShowDetails(true)}
        style={{ cursor: "pointer" }}
      >
        {/* Ligne 1 : case, nom, suppression */}
        <div className="d-flex align-items-center gap-2">
          <input
            type="checkbox"
            checked={item.completed}
            readOnly
            onClick={(event) => event.stopPropagation()}
            aria-label={`"${item.title}" terminée`}
          />

          <span
            className={`flex-grow-1 text-truncate ${
              item.completed ? "text-decoration-line-through text-muted" : ""
            }`}
            onDoubleClick={(event) => {
              event.stopPropagation();
              startEditing();
            }}
            title={canEdit ? "Double-clic pour renommer" : item.title}
          >
            {item.title}
          </span>

          {canEdit && (
            <Button
              size="sm"
              variant="outline-danger"
              aria-label={`Delete "${item.title}"`}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(item);
              }}
            >
              <i className="fa fa-trash" />
            </Button>
          )}
        </div>

        {/* Ligne 2 : priorité, échéance, assigné */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          {priority && PRIORITY_META[priority] && (
            <Badge
              bg={PRIORITY_META[priority].bg}
              text={PRIORITY_META[priority].text}
            >
              {PRIORITY_META[priority].label}
            </Badge>
          )}

          {dueDate && (
            <Badge
              bg={isOverdue ? "danger" : "light"}
              text={isOverdue ? undefined : "dark"}
              className="border"
              title={isOverdue ? "En retard" : "Échéance"}
            >
              <i className="fa fa-calendar me-1" />
              {dueDate.toLocaleDateString()}
            </Badge>
          )}

          <div
            role="presentation"
            className="ms-auto"
            style={{ minWidth: "9rem", maxWidth: "12rem" }}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <Select<AssigneeOption, false>
              inputId={`assignee-${item.id}`}
              aria-label="Assigner un utilisateur"
              options={assigneeOptions}
              value={selectedAssignee}
              onChange={handleAssign}
              isClearable
              isSearchable
              isDisabled={!canEdit || !onUpdate}
              placeholder="Non assignée"
              noOptionsMessage={() => "Aucun membre"}
              menuPortalTarget={document.body}
              menuPlacement="auto"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 2000 }),
                control: (base) => ({
                  ...base,
                  minHeight: 31,
                  fontSize: "0.875rem",
                }),
                valueContainer: (base) => ({ ...base, padding: "0 8px" }),
                indicatorsContainer: (base) => ({
                  ...base,
                  "> div": { padding: 4 },
                }),
                option: (base) => ({ ...base, fontSize: "0.875rem" }),
              }}
            />
          </div>
        </div>
      </div>

      <TaskDetailsModal
        item={item}
        users={members}
        show={showDetails}
        onClose={() => setShowDetails(false)}
        onSave={handleDetailsSave}
      />
    </>
  );
}

export default ItemDisplay;
