import type { z } from "zod";
import type { taskSchema } from "../schemas/taskSchema";

export type Task = z.infer<typeof taskSchema>;

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  order?: number;
  dueDate?: Date | null;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  columnId: string;
  assigneeId?: string | null;
};


export type UpdateTaskInput = Partial<CreateTaskInput>;