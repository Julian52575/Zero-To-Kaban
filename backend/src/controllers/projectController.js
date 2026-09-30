const projectService = require("../services/projectService");
const { EVENTS } = require("../events/events");
const { publishEvent } = require("../events/eventBus");
const { projectPayload } = require("../events/payloads");

async function createProject(req, res) {
  const project = await projectService.createProject({
    name: req.body.name,
    ownerId: req.userId,
  });
  try {
    await publishEvent(EVENTS.PROJECT_CREATED, projectPayload(project));
  } catch (error) {
    console.error("Failed to publish PROJECT_CREATED event:", error);
  }

  res.status(201).json(project);
}

async function getProjects(req, res) {
  const projects = await projectService.getProjects(req.userId);

  res.json(projects);
}

async function getProject(req, res) {
  const project = await projectService.getProject(req.params.id, req.userId);

  if (!project) {
    return res.status(404).json({
      error: "Project not found",
    });
  }
  res.json(project);
}

async function getUserProjects(req, res) {
  const projects = await projectService.getUserProjects(req.userId);

  res.json(projects);
}

async function getProjectCollaborators(req, res) {
  const project = await projectService.getProject(req.params.id, req.userId);

  if (!project) {
    return res.status(404).json({
      error: "Project not found",
    });
  }

  const collaborators = await projectService.getProjectCollaborators(
    req.params.id,
  );

  res.json(collaborators);
}

async function createProjectCollaborator(req, res) {
  const invitedUserId = req.body.userId;
  if (!invitedUserId) {
    return res.status(400).json({ error: "userId is required" });
  }
  if (invitedUserId === req.userId) {
    return res
      .status(400)
      .json({ error: "You cannot invite yourself to the project" });
  }
  const collaborator = await projectService.createProjectCollaborator(
    req.params.id,
    invitedUserId,
  );
  try {
    await publishEvent(EVENTS.PROJECT_INVITATION, {
      projectId: req.params.id,
      userId: invitedUserId,
    });
  } catch (error) {
    console.error("Failed to publish PROJECT_INVITATION event:", error);
  }

  res.json(collaborator);
}

async function updateProject(req, res) {
  const result = await projectService.updateProject(
    req.params.id,
    req.userId,
    req.body,
  );

  if (!result) {
    return res.status(404).json({
      error: "Project not found",
    });
  }

  try {
    await publishEvent(EVENTS.PROJECT_UPDATED, {
      id: req.params.id,
      beforeUpdate: projectPayload(result.before),
      afterUpdate: projectPayload(result.after),
    });
  } catch (error) {
    console.error("Failed to publish PROJECT_UPDATED event:", error);
  }

  res.json(result.after);
}

async function updateProjectCollaborator(req, res) {
  try {
    const { state } = req.body;

    if (!["ACCEPTED", "REFUSED"].includes(state)) {
      return res.status(400).json({ error: "Invalid state" });
    }

    // L'invité est l'utilisateur connecté : on ne fait pas confiance au body
    const updated = await projectService.updateProjectCollaborator(
      req.params.id,
      req.userId,
      { state },
    );

    if (!updated) {
      return res.status(404).json({ error: "Collaborator not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Failed to update project collaborator:", error);
    res.status(500).json({ error: "Failed to update collaborator" });
  }
}

async function deleteProject(req, res) {
  const deleted = await projectService.deleteProject(req.params.id, req.userId);

  if (!deleted) {
    return res.status(404).json({
      error: "Project not found",
    });
  }

  try {
    await publishEvent(EVENTS.PROJECT_DELETED, { projectId: req.params.id });
  } catch (error) {
    console.error("Failed to publish PROJECT_DELETED event:", error);
  }

  res.status(200).end();
}

module.exports = {
  getProjects,
  getProject,
  getUserProjects,
  getProjectCollaborators,
  createProjectCollaborator,
  createProject,
  updateProject,
  updateProjectCollaborator,
  deleteProject,
};
