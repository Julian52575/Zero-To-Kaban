const taskCreatedSchema = require("./schemas/taskCreated");
const taskUpdatedSchema = require("./schemas/taskUpdated");
const taskDeletedSchema = require("./schemas/taskDeleted");
const taskStatusUpdatedSchema = require("./schemas/taskStatusUpdated");
const projectCreatedSchema = require("./schemas/projectCreated");
const projectUpdatedSchema = require("./schemas/projectUpdated");
const projectDeletedSchema = require("./schemas/projectDeleted");
const taskAssignedSchema = require("./schemas/TaskAssigned");
const projectInvitationSchema = require("./schemas/projectInvitation");

const EVENTS = {
  TASK_CREATED: "task.created.v1",
  TASK_UPDATED: "task.updated.v1",
  TASK_STATUS_UPDATED: "task.status.updated.v1",
  TASK_DELETED: "task.deleted.v1",
  TASK_ASSIGNED: "task.assigned.v1",

  PROJECT_CREATED: "project.created.v1",
  PROJECT_UPDATED: "project.updated.v1",
  PROJECT_DELETED: "project.deleted.v1",
  PROJECT_INVITATION: "project.invitation.v1",
};

const EVENT_SCHEMAS = {
  [EVENTS.TASK_CREATED]: taskCreatedSchema,
  [EVENTS.TASK_UPDATED]: taskUpdatedSchema,
  [EVENTS.TASK_STATUS_UPDATED]: taskStatusUpdatedSchema,
  [EVENTS.TASK_DELETED]: taskDeletedSchema,
  [EVENTS.TASK_ASSIGNED]: taskAssignedSchema,

  [EVENTS.PROJECT_CREATED]: projectCreatedSchema,
  [EVENTS.PROJECT_UPDATED]: projectUpdatedSchema,
  [EVENTS.PROJECT_DELETED]: projectDeletedSchema,
  [EVENTS.PROJECT_INVITATION]: projectInvitationSchema,

};

module.exports = {
  EVENTS,
  EVENT_SCHEMAS,
};