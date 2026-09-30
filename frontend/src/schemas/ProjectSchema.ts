import { z } from 'zod';

export const columnSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  projectId: z.string(),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date().optional(),
  ownerId: z.string().nullable().optional(),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]),
  isOwner: z.boolean(),
  canEdit: z.boolean(),
  canManage: z.boolean(),
  columns : z.array(columnSchema).optional(),
});

export const projectsSchema = z.array(projectSchema);

export type Column = z.infer<typeof columnSchema>;
export type Project = z.infer<typeof projectSchema>;