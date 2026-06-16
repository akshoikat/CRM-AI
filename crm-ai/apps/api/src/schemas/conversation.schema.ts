import { z } from "zod";

export const sendMessageSchema = z.object({
  projectId: z.string().min(1),
  message: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  channel: z.string().optional(),
  sender: z.string().optional(),
});
