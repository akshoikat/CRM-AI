import { z } from "zod";

export const createReminderSchema = z.object({
  projectId: z.string().min(1),
  type: z.string().min(1),
  scheduleAt: z.string().min(1),
});
