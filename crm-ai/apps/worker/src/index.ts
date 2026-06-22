import { createWorker, emailQueue, whatsappQueue, reminderQueue, taskQueue } from "@crm-ai/queue";
import { NotificationService } from "@crm-ai/notifications";
import { EventName, emit } from "@crm-ai/events";
import { prisma } from "@crm-ai/db";
import { logger } from "@crm-ai/logger";

async function main() {
  const notificationService = new NotificationService();

  createWorker("email", async (job) => {
    const { notificationId, to, subject, body } = job.data;
    await notificationService.processEmail(notificationId, to, subject, body);
  });

  createWorker("whatsapp", async (job) => {
    const { notificationId, to, body } = job.data;
    await notificationService.processWhatsApp(notificationId, to, body);
  });

  createWorker("reminder", async (job) => {
    const { reminderId, projectId } = job.data;
    logger.info({ reminderId, projectId }, "Processing reminder job");
    await emit(EventName.REMINDER_TRIGGERED, { reminderId, projectId, type: "SCHEDULED" });
  });

  createWorker("task", async (job) => {
    const { taskId, projectId, type } = job.data;
    logger.info({ taskId, projectId, type }, "Processing task job");
    if (type === "complete" && taskId) {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: "DONE", completedAt: new Date() },
      });
      await emit(EventName.TASK_COMPLETED, { projectId, taskId });
    }
  });

  logger.info("Worker started — listening on email, whatsapp, reminder, task queues");

  process.on("SIGTERM", async () => {
    logger.info("Worker shutting down (SIGTERM)");
    await emailQueue.close();
    await whatsappQueue.close();
    await reminderQueue.close();
    await taskQueue.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    logger.info("Worker shutting down (SIGINT)");
    await emailQueue.close();
    await whatsappQueue.close();
    await reminderQueue.close();
    await taskQueue.close();
    process.exit(0);
  });
}

main();
