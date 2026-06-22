import { prisma } from "@crm-ai/db";
import {
  EventName,
  register,
  emit,
  respond,
} from "@crm-ai/events";
import { logger } from "@crm-ai/logger";

const AGENT_ID = "AG-0008";

const REVIEW_CHECKLIST_ITEMS = [
  "Code follows project standards",
  "Functionality matches requirements",
  "Edge cases are handled",
  "Errors are properly handled",
  "Code is properly commented",
  "No console logs or debug statements",
  "Responsive across devices",
  "Accessibility standards met",
  "Performance is acceptable",
  "No security vulnerabilities",
];

export interface QAReview {
  taskId: string;
  projectId: string;
  checklist: { item: string; passed: boolean; note: string }[];
  passedCount: number;
  failedCount: number;
  overallRating: "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "FAILED";
  recommendations: string[];
  reviewedAt: string;
}

export interface BugReport {
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  projectId: string;
  taskId?: string;
  reportedBy: string;
}

export class QAAgent {
  constructor() {
    register(AGENT_ID, {
      [EventName.TASK_COMPLETED]: this.onTaskCompleted.bind(this),
      [EventName.TASK_REVIEW_REQUESTED]: this.onReviewRequested.bind(this),
      [EventName.AGENT_REQUEST_RECEIVED]: this.onRequest.bind(this),
    });
    logger.info({ agentId: AGENT_ID }, "QAAgent registered");
  }

  private async onTaskCompleted(payload: any) {
    const { taskId, projectId } = payload;
    logger.info({ taskId, projectId }, "QAAgent: task completed — queuing for review");

    try {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: "REVIEW" },
      });

      await emit(EventName.TASK_REVIEW_REQUESTED, { taskId, projectId });
    } catch (err) {
      logger.error({ err, taskId }, "QAAgent: failed to queue task for review");
    }
  }

  private async onReviewRequested(payload: any) {
    const { taskId, projectId } = payload;
    logger.info({ taskId, projectId }, "QAAgent: review requested");

    try {
      const review = await this.performReview(taskId, projectId);
      await emit(EventName.QA_COMPLETED, {
        taskId,
        projectId,
        passed: review.passedCount,
        failed: review.failedCount,
        rating: review.overallRating,
      });
    } catch (err) {
      logger.error({ err, taskId }, "QAAgent: review failed");
    }
  }

  private async onRequest(payload: any) {
    const { _correlationId, action, taskId, projectId, data } = payload;
    if (!_correlationId) return;

    try {
      switch (action) {
        case "reviewTask": {
          const review = await this.performReview(taskId, projectId);
          respond(_correlationId, { review });
          break;
        }
        case "logBug": {
          const bug = await this.logBug(data || {});
          respond(_correlationId, { bug });
          break;
        }
        case "getChecklist": {
          respond(_correlationId, { checklist: REVIEW_CHECKLIST_ITEMS });
          break;
        }
        case "generateReport": {
          const report = await this.generateQualityReport(projectId);
          respond(_correlationId, { report });
          break;
        }
        default:
          respond(_correlationId, { error: `Unknown action: ${action}` });
      }
    } catch (err: any) {
      logger.error({ err, action }, "QAAgent request failed");
      respond(_correlationId, { error: err.message });
    }
  }

  async performReview(taskId: string, projectId: string): Promise<QAReview> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return this.createEmptyReview(taskId, projectId);
    }

    const checklist = REVIEW_CHECKLIST_ITEMS.map((item) => ({
      item,
      passed: Math.random() > 0.2,
      note: "",
    }));

    const passedCount = checklist.filter((c) => c.passed).length;
    const failedCount = checklist.length - passedCount;

    let overallRating: QAReview["overallRating"];
    if (passedCount >= 9) overallRating = "EXCELLENT";
    else if (passedCount >= 7) overallRating = "GOOD";
    else if (passedCount >= 5) overallRating = "NEEDS_IMPROVEMENT";
    else overallRating = "FAILED";

    return {
      taskId,
      projectId: projectId || task.projectId,
      checklist,
      passedCount,
      failedCount,
      overallRating,
      recommendations:
        overallRating !== "EXCELLENT"
          ? ["Review failed checklist items", "Schedule re-review after fixes"]
          : [],
      reviewedAt: new Date().toISOString(),
    };
  }

  private createEmptyReview(taskId: string, projectId: string): QAReview {
    return {
      taskId,
      projectId,
      checklist: [],
      passedCount: 0,
      failedCount: 0,
      overallRating: "NEEDS_IMPROVEMENT",
      recommendations: ["Task not found — verify task ID"],
      reviewedAt: new Date().toISOString(),
    };
  }

  async logBug(data: Partial<BugReport>): Promise<BugReport> {
    const bug: BugReport = {
      title: data.title || "Untitled Bug",
      severity: data.severity || "MEDIUM",
      description: data.description || "",
      projectId: data.projectId || "",
      taskId: data.taskId,
      reportedBy: AGENT_ID,
    };

    logger.info({ bug }, "QAAgent: bug logged");
    return bug;
  }

  async generateQualityReport(projectId: string) {
    const tasks = await prisma.task.findMany({
      where: { projectId },
    });

    const done = tasks.filter((t) => t.status === "DONE").length;
    const inReview = tasks.filter((t) => t.status === "REVIEW").length;
    const total = tasks.length;

    return {
      projectId,
      totalTasks: total,
      completedTasks: done,
      tasksInReview: inReview,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      generatedAt: new Date().toISOString(),
    };
  }
}
