const express = require("express");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.get(
  "/",
  notificationController.getNotifications
);

router.get(
  "/unread",
  notificationController.getUnreadNotifications
);

router.patch(
  "/read-all",
  notificationController.markAllAsRead
);

router.patch(
  "/:id/read",
  notificationController.markAsRead
);

router.delete(
  "/:id",
  notificationController.deleteNotification
);

module.exports = router;