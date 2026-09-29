const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_COLUMNS = [
  { name: "À faire", order: 0 },
  { name: "En cours", order: 1 },
  { name: "Terminé", order: 2 },
];

async function init() {
  await prisma.$connect();
  console.log("Connected to database via Prisma");
}

async function teardown() {
  await prisma.$disconnect();
}

async function getItems() {
  return prisma.todoItem.findMany();
}

async function getItem(id) {
  return prisma.todoItem.findUnique({ where: { id } });
}

async function storeItem(item) {
  return prisma.todoItem.create({
    data: { id: item.id, name: item.name, completed: item.completed },
  });
}

async function updateItem(id, item) {
  await prisma.todoItem.update({
    where: { id },
    data: { name: item.name, completed: item.completed },
  });
}

async function removeItem(id) {
  await prisma.todoItem.delete({ where: { id } });
}

// Prisma drops `undefined` filters, so a missing id would match any row.
async function userCanAccessProject(userId, projectId) {
  if (!userId || !projectId) return false;
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true },
  });
  return project !== null;
}

async function userCanEditProject(userId, projectId) {
  if (!userId || !projectId) return false;
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { collaborators: { some: { userId: userId, role: 'EDITOR', state: 'ACCEPTED',},},},],},
    select: {
      id: true,
    },
  });
  return project !== null;
}

async function columnBelongsToProject(columnId, projectId) {
  if (!columnId || !projectId) return false;
  const column = await prisma.column.findFirst({
    where: { id: columnId, projectId },
    select: { id: true },
  });
  return column !== null;
}

async function getColumns(projectId) {
  return prisma.column.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });
}


async function getTasks(projectId) {
  return prisma.task.findMany({
    where: { column: { projectId } },
    orderBy: [{ columnId: "asc" }, { order: "asc" }],
  });
}

async function getTask(id) {
  return prisma.task.findUnique({
    where: { id },
    include: { column: true },
  });
}

async function storeTask(columnId, creatorId, taskData) {
  const taskCount = await prisma.task.count({ where: { columnId } });

  return prisma.task.create({
    data: {
      title: taskData.title,
      description: taskData.description,
      order: taskCount,
      columnId,
      creatorId,
      assigneeId: taskData.assigneeId || null,
    },
  });
}

async function updateTask(id, updateData) {
  return prisma.task.update({
    where: { id },
    data: {
      title: updateData.title,
      description: updateData.description,
      order: updateData.order,
      columnId: updateData.columnId,
      assigneeId: updateData.assigneeId,
    },
  });
}

async function deleteTask(id) {
  return prisma.task.delete({ where: { id } });
}

async function createProject(project) {
  return prisma.project.create({
    data: {
      id: project.id,
      name: project.name,
      ownerId: project.ownerId,
      columns: { create: DEFAULT_COLUMNS },
    },
    include: { columns: { orderBy: { order: "asc" } } },
  });
}

async function getProjects(userId) {
  if (!userId) throw new Error("getProjects: userId is required");
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });
}

async function getProjectsFromUser(userId) {
  if (!userId) {
    throw new Error("getProjectsFromUser: userId is required");
  }

  return prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        {
          collaborators: {
            some: {
              userId: userId,
              state: "ACCEPTED",
            },
          },
        },
      ],
    },
    include: {
      collaborators: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function getProjectCollaborators(projectId) {
  if (!projectId) {
    throw new Error("getProjectCollaborators: projectId is required");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      collaborators: {
        select: {
          userId: true,
          role: true,
          state: true
        }
      }
    }
  });

  if (!project || !project.collaborators || project.collaborators.length === 0) {
    return [];
  }

  const userIds = project.collaborators.map(c => c.userId);

  try {
    const response = await fetch('/internal/users/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: userIds }),
    });

    if (!response.ok) {
      throw new Error(`Auth service lookup failed with status: ${response.status}`);
    }

    const users = await response.json();

    return users;

  } catch (error) {
    console.error("Failed to lookup user profile items from auth container:", error);
    return [];
  }
}

async function getProject(id) {
  return prisma.project.findUnique({
    where: { id },
    include: { columns: { orderBy: { order: "asc" } } },
  });
}

async function updateProject(id, data) {
  return prisma.project.update({
    where: { id },
    data: { name: data.name },
    include: { columns: { orderBy: { order: "asc" } } },
  });
}

async function updateDeletedProjectCollaborator(
  projectId,
  userId,
  anonymousUserId
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      ownerId: true,
    },
  });

  if (!project) {
    return null;
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      ...(project.ownerId === userId
        ? { ownerId: anonymousUserId }
        : {}),
      collaborators: {
        updateMany: {
          where: {
            userId: userId,
          },
          data: {
            userId: anonymousUserId,
          },
        },
      },
    },
    include: {
      columns: {
        orderBy: {
          order: "asc",
        },
      },
      collaborators: true,
    },
  });
}

async function deleteProject(id) {
  return prisma.project.delete({ where: { id } });
}


module.exports = {
  init,
  teardown,

  getItems,
  getItem,
  storeItem,
  updateItem,
  removeItem,

  userCanAccessProject,
  userCanEditProject,
  columnBelongsToProject,

  getColumns,

  getTasks,
  getTask,
  storeTask,
  updateTask,
  deleteTask,

  createProject,
  getProjects,
  getProjectsFromUser,
  getProjectCollaborators,
  getProject,
  updateProject,
  updateDeletedProjectCollaborator,
  deleteProject,

  prisma,
};