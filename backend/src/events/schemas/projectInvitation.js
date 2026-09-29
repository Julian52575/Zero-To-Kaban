const { z } = require("zod");

// Mirrors the Project model (with its columns); see projectPayload.
const projectInvitationSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
});

module.exports = projectInvitationSchema;
