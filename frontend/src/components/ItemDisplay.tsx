import React from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import type { Item } from "../types/item";
import TaskDetailsModal from "./TaskDetailsModal";

interface Props {
  item: Item;
  onRename: (item: Item, name: string) => void;
  onDelete: (item: Item) => void;
  onUpdate?: (item: Item, changes: Partial<Item>) => void;
}

function ItemDisplay({
  item,
  onRename,
  onDelete,
  onUpdate,
}: Props) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(item.name);
  const [showDetails, setShowDetails] = React.useState(false);

  const startEditing = () => {
    setDraft(item.name);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(item.name);
    setEditing(false);
  };

  const save = () => {
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    setEditing(false);
    onRename(item, trimmed);
  };

  const handleDetailsSave = (
    currentItem: Item,
    changes: Partial<Item>,
  ) => {
    if (onUpdate) {
      onUpdate(currentItem, changes);
    }

    if (changes.name && changes.name !== currentItem.name) {
      onRename(currentItem, changes.name);
    }
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

  return (
    <>
      <div
        className="d-flex justify-content-between align-items-center gap-2"
        onClick={() => setShowDetails(true)}
        style={{ cursor: "pointer" }}
      >
        <div className="d-flex gap-2 justify-content-center align-items-center">
          <input
            type="checkbox"
            checked={item.completed}
            readOnly
            onClick={(event) => event.stopPropagation()}
          />

          <span
            onDoubleClick={(event) => {
              event.stopPropagation();
              startEditing();
            }}
            title="Double-clic pour renommer"
          >
            {item.name}
          </span>
        </div>

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
