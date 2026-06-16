import { z } from "zod";

export const createRequirementSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  source: z.string().optional(),
});

export const updateRequirementStatusSchema = z.object({ status: z.string().min(1) });
