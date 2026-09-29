const notificationService = require("../services/notificationService");

async function getNotifications(req, res) {
  const notifications = await notificationService.getNotifications(
    req.userId
  );

  return res.status(200).json(notifications);
}

async function getUnreadNotifications(req, res) {
  const notifications =
    await notificationService.getUnreadNotifications(req.userId);

  return res.status(200).json(notifications);
}

async function markAsRead(req, res) {
  const result = await notificationService.markAsRead(
    req.params.id,
    req.userId
  );

  if (result === null) {
    return res.status(404).json({
      error: "notification not found",
    });
  }

  return res.status(204).send();
}

async function markAllAsRead(req, res) {
  await notificationService.markAllAsRead(req.userId);

  return res.status(204).send();
}

async function deleteNotification(req, res) {
  const result = await notificationService.deleteNotification(
    req.params.id,
    req.userId
  );

  if (result === null) {
    return res.status(404).json({
      error: "notification not found",
    });
  }

  return res.status(204).send();
}

module.exports = {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};