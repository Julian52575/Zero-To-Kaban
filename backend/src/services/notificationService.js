const notificationRepository = require("../repositories/notificationRepository");

async function createNotification(data, tx) {
  return notificationRepository.create(data, tx);
}

async function getNotifications(userId) {
  return notificationRepository.findAllByUserId(userId);
}

async function getUnreadNotifications(userId) {
  return notificationRepository.findUnreadByUserId(userId);
}

async function markAsRead(id, userId) {
  const result = await notificationRepository.markAsRead(id, userId);

  if (result.count === 0) {
    return null;
  }

  return true;
}

async function markAllAsRead(userId) {
  return notificationRepository.markAllAsRead(userId);
}

async function deleteNotification(id, userId) {
  const result = await notificationRepository.remove(id, userId);

  if (result.count === 0) {
    return null;
  }

  return true;
}

module.exports = {
  createNotification,
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};