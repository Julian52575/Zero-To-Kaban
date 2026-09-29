import React from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import type { Item } from "../types/item";

interface Props {
  item: Item;
  onRename: (item: Item, name: string) => void;
  onDelete: (item: Item) => void;
}

function ItemDisplay({ item, onRename, onDelete }: Props) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(item.name);

  const startEditing = () => {
    setDraft(item.name);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(item.name);
    setEditing(false);
  };

  const save = () => {
    setEditing(false);
    onRename(item, draft);
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
    <div className="d-flex justify-content-between align-items-center gap-2">
      <div className="d-flex gap-2 justify-content-center align-items-center">
        <input
          type="checkbox"
          checked={item.completed}
          
        />

        <span onDoubleClick={startEditing} title="Double-clic pour renommer">
          {item.name}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline-danger"
        aria-label={`Delete "${item.name}"`}
        onClick={() => onDelete(item)}
      >
        <i className="fa fa-trash" />
      </Button>
    </div>
  );
}

export default ItemDisplay;
