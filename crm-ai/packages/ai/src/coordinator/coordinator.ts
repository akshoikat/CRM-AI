import { MemoryService } from "@crm-ai/memory";
import {
  EventName,
  register,
  respond,
} from "@crm-ai/events";
import { logger } from "@crm-ai/logger";

const AGENT_ID = "AG-0001";

export class CoordinatorAgent {
  private memoryService: MemoryService;

  constructor() {
    this.memoryService = new MemoryService();
    this.registerWithBus();
  }

  private registerWithBus() {
    register(AGENT_ID, {
      [EventName.CLIENT_MESSAGE_RECEIVED]: async (payload: any) => {
        logger.info("Coordinator: client message received — building memory");
        await this.memoryService.buildMemory(payload.projectId);
      },
      [EventName.PROJECT_CREATED]: async (payload: any) => {
        logger.info("Coordinator: project created — building memory");
        await this.memoryService.buildMemory(payload.projectId);
      },
      [EventName.TASK_COMPLETED]: async (payload: any) => {
        if (payload.projectId) {
          logger.info("Coordinator: task completed — building memory");
          await this.memoryService.buildMemory(payload.projectId);
        }
      },
      [EventName.DEADLINE_APPROACHING]: async (payload: any) => {
        logger.warn(
          { projectId: payload.projectId, daysRemaining: payload.daysRemaining },
          "Coordinator: deadline approaching"
        );
      },
      [EventName.REMINDER_TRIGGERED]: async (payload: any) => {
        logger.info({ reminderId: payload.reminderId }, "Coordinator: reminder triggered");
      },
      [EventName.AGENT_REQUEST_RECEIVED]: async (payload: any) => {
        const correlationId = payload._correlationId;
        if (!correlationId) return;
        respond(correlationId, { acknowledged: true, agent: AGENT_ID, received: Date.now() });
      },
    });
  }

}
