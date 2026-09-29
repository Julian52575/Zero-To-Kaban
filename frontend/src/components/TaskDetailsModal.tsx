import "./TaskDetailsModal.css";
import React from "react";
import { Button, Form, Modal } from "react-bootstrap";
import type { Item, ItemStatus } from "../types/item";

interface Props {
  item: Item;
  show: boolean;
  onClose: () => void;
  onSave: (item: Item, changes: Partial<Item>) => void;
}

const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "doing", label: "Doing" },
  { value: "done", label: "Done" },
];

const USERS = [
  "Antoine",
  "Rulian",
  "Sacha",
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function TaskDetailsModal({
  item,
  show,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = React.useState(item.name);
  const [description, setDescription] = React.useState(
    item.description ?? "",
  );
  const [user, setUser] = React.useState(item.user ?? "");
  const [deadline, setDeadline] = React.useState(
    item.deadline ?? "",
  );
  const [priority, setPriority] = React.useState(
    item.priority ?? "medium",
  );
  const [status, setStatus] = React.useState<ItemStatus>(
    item.status ?? (item.completed ? "done" : "todo"),
  );

  React.useEffect(() => {
    if (show) {
      setName(item.name);
      setDescription(item.description ?? "");
      setUser(item.user ?? "");
      setDeadline(item.deadline ?? "");
      setPriority(item.priority ?? "medium");
      setStatus(
        item.status ?? (item.completed ? "done" : "todo"),
      );
    }
  }, [item, show]);

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    onSave(item, {
      name: trimmedName,
      description: description.trim(),
      user,
      deadline,
      priority,
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
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Enter a description..."
            />
          </Form.Group>

          {/* Assigned user */}
          <Form.Group className="mb-3">
            <Form.Label>Assigned user</Form.Label>

            <Form.Select
              value={user}
              onChange={(event) =>
                setUser(event.target.value)
              }
              aria-label="Select a collaborator"
            >
              <option value="">
                Select a collaborator
              </option>

              {USERS.map((userName) => (
                <option key={userName} value={userName}>
                  {userName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Deadline */}
          <Form.Group className="mb-3">
            <Form.Label>Deadline</Form.Label>

            <Form.Control
              type="date"
              value={deadline}
              onChange={(event) =>
                setDeadline(event.target.value)
              }
            />
          </Form.Group>

          {/* Priority */}
          <Form.Group className="mb-3">
            <Form.Label>Priority</Form.Label>

            <Form.Select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
            >
              {PRIORITIES.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
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
              onChange={(event) =>
                setStatus(event.target.value as ItemStatus)
              }
            >
              {STATUSES.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <div className="cancel-button" onClick={onClose}>
          Cancel
        </div>

        <div className="save-button" onClick={handleSave}>
          Save changes
        </div>
      </Modal.Footer>
    </Modal>
  );
}

export default TaskDetailsModal;
