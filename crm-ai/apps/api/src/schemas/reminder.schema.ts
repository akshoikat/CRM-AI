import { z } from "zod";

export const createReminderSchema = z.object({
  projectId: z.string().min(1),
  type: z.string().min(1).optional(),
  scheduleAt: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  dueDate: z.string().min(1).optional(),
}).refine((data) => {
  return (data.type && data.scheduleAt) || (data.title && data.dueDate);
}, { message: "Either (type + scheduleAt) or (title + dueDate) must be provided" });
