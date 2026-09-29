import type { Collaborator } from "../types/collaborator";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `Request failed with status ${response.status}`,
    );
  }

  return response.json();
}

export async function getCollaborators(
  projectId: string,
): Promise<Collaborator[]> {
  const response = await fetch(
    `/api/projects/${projectId}/collaborators`,
  );

  return handleResponse<Collaborator[]>(response);
}

/**
 * Assign a collaborator to a task.
 *
 * Pass null as collaboratorId to remove the current assignment.
 */
export async function updateTaskAssignee(
  projectId: string,
  taskId: string,
  collaboratorId: string | null,
): Promise<void> {
  const response = await fetch(
    `/api/projects/${projectId}/tasks/${taskId}/assignee`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assigneeId: collaboratorId,
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `Request failed with status ${response.status}`,
    );
  }
}
