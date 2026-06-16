import { z } from "zod";

export const createProjectSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  statement: z.string().optional(),
  budget: z.number().optional(),
  currency: z.string().optional(),
  priority: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const updateStatusSchema = z.object({ status: z.string().min(1) });
