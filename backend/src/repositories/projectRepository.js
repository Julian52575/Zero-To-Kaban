const db = require('../persistence');

async function create(project) {
    return db.createProject(project);
}

async function createProjectCollaborator(collaborator) {
    return db.createProjectCollaborator(collaborator);
}

async function getAll(userId) {
    return db.getProjects(userId);
}

async function getAllFromUser(userId) {
    return db.getProjectsFromUser(userId);
}

async function getProjectCollaborators(projectId) {
    return db.getProjectCollaborators(projectId);
}

async function updateProjectCollaborator(id, userId, data) {
    return db.updateProjectCollaborator(id, userId, data);
}

async function getProjectCollaborator(projectId, userId) {
  return db.getProjectCollaborator(projectId, userId);
}

async function getById(id, userId) {
  return db.getProject(id, userId);
}

async function update(id, data) {
    return db.updateProject(id, data);
}

async function deleteProject(id) {
    return db.deleteProject(id);
}

async function getColumnsByProject(projectId) {
  return db.getColumns(projectId);
}

async function userCanAccessProject(userId, projectId) {
  return db.userCanAccessProject(userId, projectId);
}

module.exports = {
    create,
    createProjectCollaborator,
    getAll,
    getAllFromUser,
    getProjectCollaborators,
    getById,
    getProjectCollaborator,
    update,
    updateProjectCollaborator,
    deleteProject,
    getColumnsByProject,
    userCanAccessProject,
};