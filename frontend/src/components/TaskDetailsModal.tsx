import "./TaskDetailsModal.css";
import React from "react";
import { Button, Form, Modal } from "react-bootstrap";
import type { Item, ItemStatus } from "../types/item";
import { Task } from "../types/task";

interface Props {
  item: Task;
  users: { id: string; pseudo: string }[];
  show: boolean;
  onClose: () => void;
  onSave: (item: Task, changes: Partial<Task>) => void;
}

const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "doing", label: "Doing" },
  { value: "done", label: "Done" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

function TaskDetailsModal({ item,users, show, onClose, onSave }: Props) {
  const [name, setName] = React.useState(item.title);
  const [description, setDescription] = React.useState(item.description ?? "");
  const [user, setUser] = React.useState(item.assigneeId ?? "");
  const [deadline, setDeadline] = React.useState<Date | null>(
    item.dueDate ?? null,
  );
  const [priority, setPriority] = React.useState(item.priority ?? "medium");
  const [status, setStatus] = React.useState<ItemStatus>(
    item.status ?? (item.completed ? "done" : "todo"),
  );

  React.useEffect(() => {
    if (show) {
      setName(item.title);
      setDescription(item.description ?? "");
      setUser(item.assigneeId ?? "");
      setDeadline(item.dueDate ?? null);
      setPriority(item.priority ?? "medium");
      setStatus(item.status ?? (item.completed ? "done" : "todo"));
    }
  }, [item, show]);

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    onSave(item, {
      title: trimmedName,
      description: description.trim(),
      assigneeId: user,
      dueDate: deadline,
      priority: priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
      status,
      completed: status === "done",
    });

    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Task details</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          {/* Title */}
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>

            <Form.Control
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </Form.Group>

          {/* Description */}
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>

            <Form.Control
              as="textarea"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Enter a description..."
            />
          </Form.Group>

          {/* Assigned user */}
          <Form.Group className="mb-3">
            <Form.Label>Assigned user</Form.Label>

            <Form.Select
              value={user}
              onChange={(event) => setUser(event.target.value)}
              aria-label="Select a collaborator"
            >
              <option value="">Non assignée</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.pseudo}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Deadline */}
          <Form.Group className="mb-3">
            <Form.Label>Deadline</Form.Label>

            <Form.Control
              type="date"
              value={deadline ? deadline.toISOString().split("T")[0] : ""}
              onChange={(event) =>
                setDeadline(
                  event.target.value ? new Date(event.target.value) : null,
                )
              }
            />
          </Form.Group>

          {/* Priority */}
          <Form.Group className="mb-3">
            <Form.Label>Priority</Form.Label>

            <Form.Select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              {PRIORITIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Status */}
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>

            <Form.Select
              value={status}
              onChange={(event) => setStatus(event.target.value as ItemStatus)}
            >
              {STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <button type="button" className="cancel-button" onClick={onClose}>
          Cancel
        </button>

        <button type="button" className="save-button" onClick={handleSave}>
          Save changes
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export default TaskDetailsModal;
