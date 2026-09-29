const { randomUUID: uuid } = require("crypto");
const projectRepository = require("../repositories/projectRepository");
const { $Enums } = require("@prisma/client");

async function createProject(data) {
  const project = {
    id: uuid(),
    name: data.name.trim(),
    ownerId : data.ownerId,
  };

  return projectRepository.create(project);
}

async function getProjects(userId) {
  return projectRepository.getAll(userId);
}

async function getUserProjects(userId) {
  return projectRepository.getAllFromUser(userId);
}

async function getProjectCollaborators(projectId) {
  return projectRepository.getProjectCollaborators(projectId);
}

async function createProjectCollaborator(projectId, userId) {
  const collaborator = {
    projectId,
    userId,
    role: $Enums.CollaboratorRole.VIEWER,
    state: $Enums.CollaboratorInvitationState.PENDING,
  };
  return projectRepository.createProjectCollaborator(collaborator);
}

// Projects belong to their owner: for anyone else they don't exist (null).
async function getProject(id, userId) {
  const project = await projectRepository.getById(id);
  if (!project || project.ownerId !== userId) {
    return null;
  }
  return project;
}

async function updateProject(id, userId, data) {
  const before = await getProject(id, userId);
  if (!before) {
    return null;
  }

  const after = await projectRepository.update(id, { name: data.name.trim() });

  return { before, after };
}

async function updateProjectCollaborator(id, userId, data) {
  const collaborators = await projectRepository.getProjectCollaborators(id);
  const before = collaborators.find(c => c.userId === userId);
  if (!before) {
    return null;
  }

  const after = await projectRepository.updateProjectCollaborator(id, userId, data);

  return { before, after };
}

async function deleteProject(id, userId) {
  const project = await getProject(id, userId);
  if (!project) {
    return null;
  }

  return projectRepository.deleteProject(id);
}

module.exports = {
  createProject,
  createProjectCollaborator,
  getProjects,
  getUserProjects,
  getProjectCollaborators,
  getProject,
  updateProject,
  updateProjectCollaborator,
  deleteProject,
};
