import React from "react";
import { Alert, Button, Form, Offcanvas, Spinner } from "react-bootstrap";

import type { User } from "../../types/user";
import Swal from "sweetalert2";

import {
  getCurrentUser,
  updateMe,
  deleteMe,
  logout,
  downloadUserData,
} from "../../services/userApi";

interface UserProfileModalProps {
  show: boolean;
  onClose: () => void;
}

function UserProfileModal({ show, onClose }: UserProfileModalProps) {
  const [user, setUser] = React.useState<User | null>(null);
  const [username, setUsername] = React.useState("");
  // const [password, setpassword] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!show) {
      return;
    }

    setLoading(true);
    setError(null);

    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setUsername(currentUser.username);
      })
      .catch(() => {
        setError("Unable to load your profile.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [show]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedUser = await updateMe(username);

      setUser(updatedUser);
      setUsername(updatedUser.username);
    } catch {
      setError("Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    onClose();
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const passwordPrompte = await Swal.fire({
        title: "Enter your password to confirm",
        text: "This action is permanent and cannot be undone.",
        input: "password",
        inputAttributes: {
          autocapitalize: "off",
          autocorrect: "off",
        },
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Delete my account",
        cancelButtonText: "Cancel",
        didOpen: () => {
          const input = Swal.getInput() as HTMLInputElement;
          if (input) {
            input.focus();
          }
        },
        inputValidator(value) {
          if (!value) {
            return "You need to enter your password!";
          }
        },
      });

      if (!passwordPrompte.isConfirmed) {
        return;
      }
      await deleteMe(passwordPrompte.value);
      window.location.href = "/";
    } catch {
      await Swal.fire({
        title: "Error",
        text: "Unable to delete your account. Please check your password and try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();

      window.location.href = "/";
    } catch {
      setError("Unable to logout.");
    }
  };

  const handleDownloadData = async () => {
    try {
      const dataBlob = await downloadUserData();
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "user_data.json");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      setError("Unable to download your data.");
    }
  };

  return (
    <Offcanvas
      show={show}
      onHide={onClose}
      placement="end"
      scroll={false}
      backdrop={true}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>User profile</Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : (
          <>
            <Form onSubmit={handleSave}>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>

                <Form.Control
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </Form.Group>

              {/* <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>

                <Form.Control
                  type="password"
                  value={password}
                  onChange={(event) => setpassword(event.target.value)}
                />
              </Form.Group> */}

              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                className="w-100"
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </Form>

            <hr className="my-4" />

            <div className="d-grid gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => handleDownloadData()}
              >
                Download my data
              </Button>
              <Button variant="outline-secondary" onClick={handleLogout}>
                Logout
              </Button>

              <Button variant="outline-danger" onClick={handleDelete}>
                Delete account
              </Button>
            </div>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}

export default UserProfileModal;
