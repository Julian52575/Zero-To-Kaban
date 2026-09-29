const taskService = require("../services/taskService");
const { EVENTS } = require("../events/events");
const { publishEvent } = require("../events/eventBus");
const { taskPayload } = require("../events/payloads");
const {
  userCanAccessProject,
  columnBelongsToProject,
  storeTask,
} = require("../persistence");

async function getTasks(req, res, next) {
  try {
    const { projectId } = req.params;

    if (!(await userCanAccessProject(req.userId, projectId))) {
      return res.status(404).json({ error: "project not found" });
    }

    const tasks = await taskService.getTasks(projectId);

    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

// The task must exist and live in the project named in the URL.
async function findProjectTask(projectId, taskId) {
  const task = await taskService.getTask(taskId);
  if (!task || task.column.projectId !== projectId) {
    return null;
  }
  return task;
}

async function getTask(req, res, next) {
  try {
    const { projectId, id } = req.params;

    if (!(await userCanAccessProject(req.userId, projectId))) {
      return res.status(404).json({ error: "project not found" });
    }

    const task = await findProjectTask(projectId, id);
    if (!task) {
      return res.status(404).json({ error: "task not found" });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const { projectId } = req.params;
    const creatorId = req.userId;
    const { title, description, columnId, assigneeId } = req.body;

    if (!(await userCanAccessProject(creatorId, projectId))) {
      return res.status(404).json({ error: "project not found" });
    }

    if (!(await columnBelongsToProject(columnId, projectId))) {
      return res.status(400).json({ error: "invalid column" });
    }

    if (!(await userCanAccessProject(creatorId, projectId))) {
      return res.status(403).json({ error: "invalid role" });
    }

    const task = await storeTask(columnId, creatorId, {
      title,
      description,
      assigneeId,
    });

    try {
      await publishEvent(EVENTS.TASK_CREATED, taskPayload(task, projectId));
    } catch (error) {
      console.error("Failed to publish TASK_CREATED event:", error);
    }

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const { projectId, id } = req.params;
    const { columnId } = req.body;

    if (!(await userCanAccessProject(req.userId, projectId))) {
      return res.status(404).json({ error: "project not found" });
    }

    if (!(await findProjectTask(projectId, id))) {
      return res.status(404).json({ error: "task not found" });
    }

    // A move must stay inside the project.
    if (
      columnId !== undefined &&
      !(await columnBelongsToProject(columnId, projectId))
    ) {
      return res.status(400).json({ error: "invalid column" });
    }

    if (!(await userCanAccessProject(req.userId, projectId))) {
      return res.status(400).json({ error: "invalid role" });
    }

    const lastTask = await taskService.getTask(id);
    const task = await taskService.updateTask(id, req.body);

    try {
      await publishEvent(EVENTS.TASK_UPDATED, taskPayload(task, projectId));
    } catch (error) {
      console.error("Failed to publish TASK_UPDATED event:", error);
    }

    if (lastTask.assigneeId !== task.assigneeId) {
      try {
        await publishEvent(EVENTS.TASK_ASSIGNED, taskPayload(task, projectId));
      } catch (error) {
        console.error("Failed to publish TASK_ASSIGNED event:", error);
      }
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res) {
  const userId = req.userId;
  const taskId = req.params.id;

  const rep = await taskService.deleteTask(taskId, userId);

  if (rep === null) {
    return res.status(404).json({ error: "task not found" });
  }

  if (rep === false) {
    return res.status(403).json({ error: "forbidden" });
  }

  try {
    await publishEvent(EVENTS.TASK_DELETED, { taskId });
  } catch (error) {
    console.error("Failed to publish TASK_DELETED event:", error);
  }

  return res.status(204).end();
}

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
