import { z } from "zod";

export const createDeveloperSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  skills: z.any().optional(),
});

export const updateDeveloperSchema = createDeveloperSchema.partial();
