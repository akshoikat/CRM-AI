import { prisma } from "@crm-ai/db";
import { ReminderType } from "@crm-ai/shared";
import { EventName, emit } from "@crm-ai/events";
import { NotificationService } from "@crm-ai/notifications";
import { logger } from "@crm-ai/logger";

export class ReminderService {
  private notificationService = new NotificationService();

  async findByProjectId(projectId: string) {
    return prisma.reminder.findMany({
      where: { projectId },
      orderBy: { scheduleAt: "asc" },
      take: 50,
    });
  }

  async create(data: {
    projectId: string;
    type: string;
    scheduleAt: Date;
  }) {
    return prisma.reminder.create({
      data: {
        projectId: data.projectId,
        type: data.type as ReminderType,
        scheduleAt: data.scheduleAt,
      },
    });
  }

  async update(id: string, data: any) {
    return prisma.reminder.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.reminder.delete({ where: { id } });
  }

  async getDueReminders() {
    return prisma.reminder.findMany({
      where: {
        status: "PENDING",
        scheduleAt: { lte: new Date() },
      },
      include: { project: true },
      take: 100,
    });
  }

  async markSent(id: string) {
    return prisma.reminder.update({
      where: { id },
      data: { status: "SENT" },
    });
  }

  async processAndNotify() {
    const reminders = await this.getDueReminders();
    logger.info({ count: reminders.length }, "Processing due reminders");

    for (const reminder of reminders) {
      try {
        const title = `Reminder: ${reminder.type}`;
        const body = `Reminder for project "${reminder.project.title}": ${reminder.type}`;
        await this.notificationService.sendEmail(reminder.project.clientId, title, body);
        await this.markSent(reminder.id);
        await emit(EventName.REMINDER_TRIGGERED, {
          reminderId: reminder.id,
          projectId: reminder.projectId,
          type: reminder.type,
        });
        logger.info({ reminderId: reminder.id }, "Reminder processed and notified");
      } catch (error) {
        logger.error({ reminderId: reminder.id, error }, "Failed to process reminder");
      }
    }
  }
}
