import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  developerId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({ status: z.string().optional() });
