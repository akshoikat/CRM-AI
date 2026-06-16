import { prisma } from "@crm-ai/db";
import { EventName, emit } from "@crm-ai/events";
import { logger } from "@crm-ai/logger";
import type { DeadlineApproachingPayload } from "@crm-ai/events";

export class ReminderAgent {
  async checkDeadlines() {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const projects = await prisma.project.findMany({
      where: {
        deadline: {
          gte: now,
          lte: threeDaysLater,
        },
        status: { in: ["ACTIVE", "DRAFT"] },
      },
      include: { client: true },
    });

    for (const project of projects) {
      if (!project.deadline) continue;

      const daysRemaining = Math.ceil(
        (project.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const payload: DeadlineApproachingPayload = {
        projectId: project.id,
        deadline: project.deadline.toISOString(),
        daysRemaining,
      };

      try {
        await emit(EventName.DEADLINE_APPROACHING, payload);
      } catch (err) {
        logger.error({ err, projectId: project.id }, "Failed to emit DEADLINE_APPROACHING");
      }
      logger.warn({ projectId: project.id, daysRemaining }, "Deadline approaching");
    }
  }

  async processDueReminders() {
    const reminders = await prisma.reminder.findMany({
      where: {
        status: "PENDING",
        scheduleAt: { lte: new Date() },
      },
      include: { project: { include: { client: true } } },
      take: 200,
    });

    for (const reminder of reminders) {
      try {
        await emit(EventName.REMINDER_TRIGGERED, {
          reminderId: reminder.id,
          projectId: reminder.projectId,
          type: reminder.type,
        });
      } catch (err) {
        logger.error({ err, reminderId: reminder.id }, "Failed to emit REMINDER_TRIGGERED");
      }

      try {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "SENT" },
        });
      } catch (err) {
        logger.error({ err, reminderId: reminder.id }, "Failed to update reminder status");
      }
    }
  }
}
