const taskRepository = require("../repositories/taskRepository");
const { userCanAccessProject, userCanEditProject } = require("../persistence");

async function getTasks(projectId) {
  return taskRepository.getAll(projectId);
}

async function getTask(id) {
  return taskRepository.getById(id);
}

async function createTask(columnId, creatorId, taskData) {
  const response = await taskRepository.create(columnId, creatorId, taskData);
  return response;
}

async function updateTask(id, taskData) {
  return taskRepository.update(id, taskData);
}

async function deleteTask(id, userId) {
  const task = await taskRepository.getById(id);

  if (!task) {
    return null;
  }

  if (!(await userCanAccessProject(userId, task.column.projectId))) {
    return false;
  }

  if (!(await userCanEditProject(userId, task.column.projectId))) {
    return false;
  }

  return await taskRepository.deleteById(id);
}

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
