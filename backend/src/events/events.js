const taskCreatedSchema = require("./schemas/taskCreated");
const taskUpdatedSchema = require("./schemas/taskUpdated");
const taskDeletedSchema = require("./schemas/taskDeleted");
const taskStatusUpdatedSchema = require("./schemas/taskStatusUpdated");
const projectCreatedSchema = require("./schemas/projectCreated");
const projectUpdatedSchema = require("./schemas/projectUpdated");
const projectDeletedSchema = require("./schemas/projectDeleted");
const userDeletedSchema = require("./schemas/userDeleted");

const EVENTS = {
  TASK_CREATED: "task.created.v1",
  TASK_UPDATED: "task.updated.v1",
  TASK_STATUS_UPDATED: "task.status.updated.v1",
  TASK_DELETED: "task.deleted.v1",

  PROJECT_CREATED: "project.created.v1",
  PROJECT_UPDATED: "project.updated.v1",
  PROJECT_DELETED: "project.deleted.v1",

  USER_DELETED: "user.deleted.v1",
};

const EVENT_SCHEMAS = {
  [EVENTS.TASK_CREATED]: taskCreatedSchema,
  [EVENTS.TASK_UPDATED]: taskUpdatedSchema,
  [EVENTS.TASK_STATUS_UPDATED]: taskStatusUpdatedSchema,
  [EVENTS.TASK_DELETED]: taskDeletedSchema,

  [EVENTS.PROJECT_CREATED]: projectCreatedSchema,
  [EVENTS.PROJECT_UPDATED]: projectUpdatedSchema,
  [EVENTS.PROJECT_DELETED]: projectDeletedSchema,

  [EVENTS.USER_DELETED]: userDeletedSchema,
};

module.exports = {
  EVENTS,
  EVENT_SCHEMAS,
};