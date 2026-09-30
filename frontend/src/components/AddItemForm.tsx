import React from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
import { getErrorMessage } from "../utils/errorMessage";
import { createTask } from "../services/taskService";
import { Task } from "../types/task";

interface AddItemFormProps {
  projectId: string;
  onNewItem: (item: Task) => void;
  columnId?: string;
}

function AddItemForm({ projectId, onNewItem, columnId }: AddItemFormProps) {
  const [newItem, setNewItem] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submitNewItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!columnId) return;

    setSubmitting(true);
    setError(null);
    createTask(projectId, { title: newItem.trim(), columnId })
      .then((task) => {
        onNewItem(task);
        setNewItem("");
      })
      .catch((error) => {
        console.error(error);
        setError(getErrorMessage(error));
      })
      .finally(() => {
        setSubmitting(false);
      });
  };
  const isDisabled = submitting || !columnId || newItem.trim().length === 0;

  return (
    <Form onSubmit={submitNewItem}>
      <Form.Label htmlFor={`new-item-${projectId}`}>Add a new task</Form.Label>
      <InputGroup className="mb-3">
        <Form.Control
          id={`new-item-${projectId}`}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          type="text"
          placeholder="New Item"
          aria-describedby="basic-addon1"
        />
        <Button
          type="submit"
          variant="success"
          className={isDisabled ? "disabled" : ""}
          disabled={isDisabled}
        >
          {submitting ? "Adding..." : "Add Item"}
        </Button>
      </InputGroup>
      {error && <p className="text-danger">{error}</p>}
    </Form>
  );
}

export default AddItemForm;
