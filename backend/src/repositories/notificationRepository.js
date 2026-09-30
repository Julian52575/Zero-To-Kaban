const { prisma } = require("../persistence");

async function create(data, tx = prisma) {
  return tx.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      eventId: data.eventId,
      data: data.data,
    },
  });
}

async function findAllByUserId(userId) {
  return prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function findUnreadByUserId(userId) {
  return prisma.notification.findMany({
    where: {
      userId,
      read: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function markAsRead(id, userId) {
  return prisma.notification.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      read: true,
    },
  });
}

async function markAllAsRead(userId) {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });
}

async function remove(id, userId) {
  return prisma.notification.deleteMany({
    where: {
      id,
      userId,
    },
  });
}

module.exports = {
  create,
  findAllByUserId,
  findUnreadByUserId,
  markAsRead,
  markAllAsRead,
  remove,
};
