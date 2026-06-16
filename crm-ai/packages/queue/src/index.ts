import { Queue, Worker } from "bullmq";
import { logger } from "@crm-ai/logger";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const emailQueue = new Queue("email", { connection });
export const whatsappQueue = new Queue("whatsapp", { connection });
export const reminderQueue = new Queue("reminder", { connection });
export const taskQueue = new Queue("task", { connection });

export function createWorker(
  queueName: string,
  handler: (job: any) => Promise<void>
) {
  const worker = new Worker(queueName, async (job) => {
    logger.info({ jobId: job.id, queueName }, "Processing job");
    await handler(job);
  }, { connection });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, queueName }, "Job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, queueName, err }, "Job failed");
  });

  return worker;
}
