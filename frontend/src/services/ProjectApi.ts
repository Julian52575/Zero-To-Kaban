import apiClient from "./apiClient";
import { projectSchema, projectsSchema } from "../schemas/ProjectSchema";
import type { Project } from "../types/Project";

export const getProjects = async (): Promise<Project[]> => {
  const data = await apiClient.get<Project[]>("/api/projects");
  const projectsWithDates = data.map((project: Project) => ({
    ...project,
    createdAt: new Date(project.createdAt || Date.now()),
  }));
  return projectsSchema.parse(projectsWithDates);
};

export const createProject = async (name: string): Promise<Project> => {
  const data = await apiClient.post<Project>("/api/projects", {
    name,
  });
  const projectWithDate = {
    ...data,
    createdAt: new Date((data as any).createdAt || Date.now()),
  };
  return projectSchema.parse(projectWithDate);
};

export const updateProject = async (item: Project): Promise<Project> => {
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
