import { MemoryService } from "@crm-ai/memory";
import { EventName, EventPayloads } from "@crm-ai/events";
import { logger } from "@crm-ai/logger";

export class CoordinatorAgent {
  private memoryService: MemoryService;

  constructor() {
    this.memoryService = new MemoryService();
  }

  async handleEvent(eventName: string, payload: any) {
    logger.info({ eventName }, "Coordinator: handling event");

    try {
      switch (eventName) {
        case EventName.CLIENT_MESSAGE_RECEIVED:
          await this.memoryService.buildMemory(payload.projectId);
          break;
        case EventName.PROJECT_CREATED:
          await this.memoryService.buildMemory(payload.projectId);
          break;
        case EventName.TASK_COMPLETED:
          if (payload.projectId) {
            await this.memoryService.buildMemory(payload.projectId);
          }
          break;
        case EventName.DEADLINE_APPROACHING:
          logger.warn({ projectId: payload.projectId }, "Deadline approaching");
          break;
        case EventName.REMINDER_TRIGGERED:
          logger.info({ reminderId: payload.reminderId }, "Reminder triggered");
          break;
      }
    } catch (err) {
      logger.error({ err, eventName }, "Coordinator handler failed");
    }
  }
}
