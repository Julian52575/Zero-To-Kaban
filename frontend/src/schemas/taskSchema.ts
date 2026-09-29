import { z } from "zod";

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  order: z.number(),
  columnId: z.string(),
  creatorId: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  // coerce transforme la string ISO envoyée par l'API en Date
  dueDate: z.coerce.date().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  completed: z.boolean().optional(),

  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const tasksSchema = z.array(taskSchema);