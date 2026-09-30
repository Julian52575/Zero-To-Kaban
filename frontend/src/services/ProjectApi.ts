import apiClient from "./apiClient";
import { projectSchema, projectsSchema } from "../schemas/ProjectSchema";
import type { Project } from "../types/Project";

export const getProjects = async (): Promise<any[]> => {
  const data = await apiClient.get<Project[]>("/api/projects");
  const projectsWithDates = data.map((project: Project) => ({
    ...project,
    createdAt: new Date(project.createdAt || Date.now()),
  }));
  return projectsSchema.parse(projectsWithDates);
};

export const getProject = async (id: string): Promise<any> => {
  const data = await apiClient.get<Project[]>("/api/projects/" + id);
  const projectWithDates = {
    ...data,
    createdAt: new Date((data as any).createdAt || Date.now()),
  };
  return projectSchema.parse(projectWithDates);
};

const projectBaseSchema = projectSchema.omit({
  role: true,
  isOwner: true,
  canEdit: true,
  canManage: true,
});

export const createProject = async (name: string): Promise<any> => {
  const data = await apiClient.post<unknown>("/api/projects", {
    name,
  });
  const project = projectBaseSchema.parse({
    ...(data as object),
    createdAt: new Date(
      (data as { createdAt?: string }).createdAt || Date.now(),
    ),
  });
  return {
    ...project,
    role: "OWNER",
    isOwner: true,
    canEdit: true,
    canManage: true,
  };
};

export const updateProject = async (item: Project): Promise<any> => {
  const data = await apiClient.put<Project>(`/api/projects/${item.id}`, {
    name: item.name,
    createdAt: item.createdAt,
  });
  const projectWithDate = {
    ...data,
    createdAt: new Date((data as any).createdAt || Date.now()),
  };
  return projectSchema.parse(projectWithDate);
};

export const deleteProject = (id: string): Promise<void> => {
  return apiClient.delete(`/api/projects/${id}`);
};

export const inviteCollaborator = async (
  projectId: string,
  collaboratorId: string,
): Promise<unknown> => {
  const rep = await apiClient.post(`/api/projects/${projectId}/invitation`, {
    userId: collaboratorId,
  });
  return rep;
};

export const AcceptInvitation = async (
  projectId: string,
  collaboratorId: string,
): Promise<unknown> => {
  const rep = await apiClient.put(`/api/projects/${projectId}/invitation`, {
    role: "EDITOR",
    state: "ACCEPTED",
  });
  return rep;
};

export const declineInvitation = async (
  projectId: string,
  collaboratorId: string,
): Promise<unknown> => {
  const rep = await apiClient.put(`/api/projects/${projectId}/invitation`, {
    state: "REFUSED",
  });
  return rep;
};

export const getProjectCollaborators = async (
  projectId: string,
): Promise<{ id: string; pseudo: string }[]> => {
  const data = await apiClient.get<unknown>(
    `/api/projects/${projectId}/collaborators`,
  );
  return data as { id: string; pseudo: string }[];
};

export const leaveProject = async (projectId: string): Promise<unknown> => {
  const data = await apiClient.delete(
    `/api/projects/${projectId}/collaborators/me`,
  );
  return data;
};
