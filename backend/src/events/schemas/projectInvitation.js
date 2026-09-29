const { z } = require("zod");

// Mirrors the Project model (with its columns); see projectPayload.
const projectInvitationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  createdAt: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .optional(),
  ownerId: z.string().uuid(),
  columns: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      order: z.number(),
    }),
  ),
});

module.exports = projectInvitationSchema;
