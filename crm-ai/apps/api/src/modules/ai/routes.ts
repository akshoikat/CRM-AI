import { FastifyInstance } from "fastify";
import {
  AssignmentAgent,
  EstimateAgent,
  FinanceAgent,
  MeetingAgent,
  QAAgent,
} from "@crm-ai/ai";
import { MemoryService } from "@crm-ai/memory";
import { prisma } from "@crm-ai/db";
import { handleError } from "../../lib/error-handler";

export async function aiRoutes(app: FastifyInstance) {
  const estimateAgent = new EstimateAgent();
  const assignmentAgent = new AssignmentAgent();
  const financeAgent = new FinanceAgent();
  const meetingAgent = new MeetingAgent();
  const qaAgent = new QAAgent();
  const memoryService = new MemoryService();

  app.post("/ai/assignment", async (req, reply) => {
    try {
      const { projectId } = req.body as { projectId: string };
      const result = await assignmentAgent.evaluateAssignment(projectId);
      return { success: true, assignmentId: result, projectId };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/ai/estimate", async (req, reply) => {
    try {
      const { projectId, description } = req.body as { projectId: string; description?: string };
      const estimate = await estimateAgent.estimate(description || await getProjectDescription(projectId) || "");
      return { estimate };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/ai/rebuild-memory", async (req, reply) => {
    try {
      const { projectId } = req.body as { projectId: string };
      const memory = await memoryService.buildMemory(projectId);
      return { memory };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/projects/:projectId/memory", async (req, reply) => {
    try {
      const { projectId } = req.params as { projectId: string };
      const memory = await memoryService.getMemory(projectId);
      if (!memory) return reply.status(404).send({ error: "Memory not found" });
      return memory;
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/ai/process-reminders", async (req, reply) => {
    try {
      const { ReminderAgent } = await import("@crm-ai/ai");
      const agent = new ReminderAgent();
      await agent.processDueReminders();
      return { processed: true };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/ai/finance/budget-status", async (req, reply) => {
    try {
      const { projectId } = req.body as { projectId: string };
      const status = await financeAgent.getBudgetStatus(projectId);
      return { status };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/ai/finance/invoice", async (req, reply) => {
    try {
      const { projectId, data } = req.body as { projectId: string; data?: any };
      const invoice = await financeAgent.generateInvoice(projectId, data);
      return { invoice };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/ai/meeting/agenda", async (req, reply) => {
    try {
      const { projectId } = req.body as { projectId: string };
      const agenda = await meetingAgent.generateAgenda(projectId);
      return { agenda };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/ai/meeting/follow-up", async (req, reply) => {
    try {
      const { projectId } = req.body as { projectId: string };
      const tasks = await meetingAgent.generateFollowUpTasks(projectId);
      return { tasks };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/ai/qa/review", async (req, reply) => {
    try {
      const { taskId, projectId } = req.body as { taskId: string; projectId: string };
      const review = await qaAgent.performReview(taskId, projectId);
      return { review };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/ai/qa/report", async (req, reply) => {
    try {
      const { projectId } = req.body as { projectId: string };
      const report = await qaAgent.generateQualityReport(projectId);
      return { report };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/ai/qa/bug", async (req, reply) => {
    try {
      const data = req.body as any;
      const bug = await qaAgent.logBug(data);
      return { bug };
    } catch (error) {
      return handleError(reply, error);
    }
  });
}

async function getProjectDescription(projectId: string): Promise<string | null> {
  if (!projectId) return null;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { requirements: { take: 5, orderBy: { createdAt: "desc" } } },
  });
  if (!project) return null;
  return [project.title, project.description, ...project.requirements.map((r) => r.title + ": " + (r.description || ""))].filter(Boolean).join("\n");
}
