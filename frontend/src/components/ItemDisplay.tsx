import React from "react";
import { Badge, Button, Form, InputGroup } from "react-bootstrap";
import type { Item } from "../types/item";
import TaskDetailsModal from "./TaskDetailsModal";
import Select, { SingleValue } from "react-select";

interface AssigneeOption {
  value: string;
  label: string;
}

type Priority = "HIGH" | "MEDIUM" | "LOW";

type Member = { id: string; pseudo: string };

interface Props {
  item: Item;
  onRename: (item: Item, name: string) => void;
  onDelete: (item: Item) => void;
  onUpdate?: (item: Item, changes: Partial<Item>) => void;
  members?: Member[]; // utilisateurs assignables (propriétaire + collaborateurs)
  canEdit?: boolean; // false pour un VIEWER
}

const PRIORITY_META: Record<
  Priority,
  { label: string; bg: string; text?: string }
> = {
  HIGH: { label: "Haute", bg: "danger" },
  MEDIUM: { label: "Moyenne", bg: "warning", text: "dark" },
  LOW: { label: "Basse", bg: "secondary" },
};

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ItemDisplay({
  item,
  onRename,
  onDelete,
  onUpdate,
  members = [],
  canEdit = true,
}: Props) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(item.name);
  const [showDetails, setShowDetails] = React.useState(false);

  const priority = "HIGH" as Priority | undefined; // TODO: item.priority
  const dueDate = parseDate("2024-06-15T12:00:00Z"); // TODO: item.dueDate

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isOverdue =
    dueDate !== null && dueDate < startOfToday && !item.completed;

  const startEditing = () => {
    if (!canEdit) return;
    setDraft(item.name);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(item.name);
    setEditing(false);
  };

  const save = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setEditing(false);
    onRename(item, trimmed);
  };

  const handleDetailsSave = (currentItem: Item, changes: Partial<Item>) => {
    if (onUpdate) {
      onUpdate(currentItem, changes);
    }
    if (changes.name && changes.name !== currentItem.name) {
      onRename(currentItem, changes.name);
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
            aria-label={`"${item.name}" terminée`}
          />

          <span
            className={`flex-grow-1 text-truncate ${
              item.completed ? "text-decoration-line-through text-muted" : ""
            }`}
            onDoubleClick={(event) => {
              event.stopPropagation();
              startEditing();
            }}
            title={canEdit ? "Double-clic pour renommer" : item.name}
          >
            {item.name}
          </span>

          {canEdit && (
            <Button
              size="sm"
              variant="outline-danger"
              aria-label={`Delete "${item.name}"`}
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
        show={showDetails}
        onClose={() => setShowDetails(false)}
        onSave={handleDetailsSave}
      />
    </>
  );
}

export default ItemDisplay;
