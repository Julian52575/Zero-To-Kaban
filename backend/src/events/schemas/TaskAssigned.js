const { z } = require("zod");

// Mirrors the Task model plus the project it belongs to; see taskPayload.
const taskAssignedSchema = z.object({
    taskId: z.string(),
    projectId: z.string(),
    columnId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    order: z.number(),
    creatorId: z.string(),
    assigneeId: z.string().nullable(),
});

module.exports = taskAssignedSchema;
