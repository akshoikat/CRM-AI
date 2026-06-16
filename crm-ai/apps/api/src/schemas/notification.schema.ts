import { z } from "zod";

export const createNotificationSchema = z.object({
  receiverType: z.string().min(1),
  receiverId: z.string().min(1),
  channel: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});
