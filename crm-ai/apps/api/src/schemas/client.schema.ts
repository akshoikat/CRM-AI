import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  company: z.string().optional(),
  timezone: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();
