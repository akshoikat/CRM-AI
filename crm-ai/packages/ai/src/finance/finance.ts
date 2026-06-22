import { prisma } from "@crm-ai/db";
import {
  EventName,
  register,
  emit,
  respond,
} from "@crm-ai/events";
import { logger } from "@crm-ai/logger";
import { ReminderType } from "@crm-ai/shared";

const AGENT_ID = "AG-0006";

export interface InvoiceData {
  projectId: string;
  clientId: string;
  amount: number;
  currency: string;
  items: string[];
  dueDate: string;
}

export interface BudgetStatus {
  projectId: string;
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: "OK" | "WARNING" | "EXCEEDED";
}

export class FinanceAgent {
  constructor() {
    register(AGENT_ID, {
      [EventName.PAYMENT_RECEIVED]: this.onPaymentReceived.bind(this),
      [EventName.PAYMENT_PENDING]: this.onPaymentPending.bind(this),
      [EventName.PROJECT_COMPLETED]: this.onProjectCompleted.bind(this),
      [EventName.AGENT_REQUEST_RECEIVED]: this.onRequest.bind(this),
    });
    logger.info({ agentId: AGENT_ID }, "FinanceAgent registered");
  }

  private async onPaymentReceived(payload: any) {
    logger.info({ payload }, "FinanceAgent: payment received");
  }

  private async onPaymentPending(payload: any) {
    logger.info({ payload }, "FinanceAgent: payment pending");

    try {
      await prisma.reminder.create({
        data: {
          projectId: payload.projectId || "unknown",
          type: ReminderType.PAYMENT,
          scheduleAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    } catch (err) {
      logger.error({ err }, "FinanceAgent: failed to create payment reminder");
    }
  }

  private async onProjectCompleted(payload: any) {
    const { projectId } = payload;
    logger.info({ projectId }, "FinanceAgent: project completed — generating summary");

    try {
      const status = await this.getBudgetStatus(projectId);
      await emit(EventName.BUDGET_UPDATED, {
        projectId,
        budget: status.budget,
        spent: status.spent,
        remaining: status.remaining,
      });
    } catch (err) {
      logger.error({ err, projectId }, "FinanceAgent: budget summary failed");
    }
  }

  private async onRequest(payload: any) {
    const { _correlationId, action, projectId, data } = payload;
    if (!_correlationId) return;

    try {
      switch (action) {
        case "getBudgetStatus": {
          const status = await this.getBudgetStatus(projectId);
          respond(_correlationId, { status });
          break;
        }
        case "generateInvoice": {
          const invoice = await this.generateInvoice(projectId, data);
          respond(_correlationId, { invoice });
          break;
        }
        case "checkBudgetExceeded": {
          const status = await this.getBudgetStatus(projectId);
          if (status.status === "EXCEEDED") {
            await emit(EventName.BUDGET_EXCEEDED, {
              projectId,
              budget: status.budget,
              spent: status.spent,
            });
          }
          respond(_correlationId, { budgetExceeded: status.status === "EXCEEDED" });
          break;
        }
        default:
          respond(_correlationId, { error: `Unknown action: ${action}` });
      }
    } catch (err: any) {
      logger.error({ err, action, projectId }, "FinanceAgent request failed");
      respond(_correlationId, { error: err.message });
    }
  }

  async getBudgetStatus(projectId: string): Promise<BudgetStatus> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { tasks: true },
    });

    const budget = project?.budget ? Number(project.budget) : 0;
    const completedTasks = project?.tasks.filter((t) => t.status === "DONE").length || 0;
    const totalTasks = project?.tasks.length || 1;
    const spent = budget * (completedTasks / totalTasks);
    const remaining = budget - spent;
    const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;

    let status: BudgetStatus["status"] = "OK";
    if (percentUsed > 100) status = "EXCEEDED";
    else if (percentUsed > 80) status = "WARNING";

    return {
      projectId,
      budget,
      spent: Math.round(spent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      percentUsed: Math.round(percentUsed * 100) / 100,
      status,
    };
  }

  async generateInvoice(projectId: string, data?: any): Promise<InvoiceData> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true, tasks: { where: { status: "DONE" } } },
    });

    const items = project?.tasks.map((t) => t.title) || [];
    const amount = data?.amount || (project?.budget ? Number(project.budget) : 0);
    const currency = project?.currency || "USD";
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const invoice: InvoiceData = {
      projectId,
      clientId: project?.clientId || "",
      amount,
      currency,
      items,
      dueDate,
    };

    logger.info({ invoice }, "FinanceAgent: invoice generated");

    await emit(EventName.INVOICE_GENERATED, {
      projectId,
      amount,
      currency,
    });

    return invoice;
  }
}
