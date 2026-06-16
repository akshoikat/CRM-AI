import { RequirementStatus } from "@crm-ai/shared";
import { prisma } from "@crm-ai/db";
import { EventName, emit } from "@crm-ai/events";

export class MemoryService {
  async buildMemory(projectId: string) {
    let project;
    let conversations;
    let requirements;
    let tasks;

    try {
      [project, conversations, requirements, tasks] = await Promise.all([
        prisma.project.findUnique({
          where: { id: projectId },
          include: { client: true },
        }),
        prisma.conversation.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.requirement.findMany({
          where: { projectId, status: { not: RequirementStatus.REJECTED } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.task.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
        }),
      ]);
    } catch {
      return null;
    }

    if (!project) return null;

    const sortedConvs = [...conversations].reverse();
    const lastReq = requirements[0];
    const lastConv = conversations[0];

    const topicKeywords: Record<string, string[]> = {
      requirements: ["add ", "new ", "need ", "require", "feature", "want"],
      progress: ["progress", "status", "update", "done", "complete", "working"],
      budget: ["budget", "cost", "price", "spend", "payment", "invoice"],
      deadline: ["deadline", "when", "due", "timeline", "schedule", "delivery"],
      issues: ["issue", "problem", "bug", "complaint", "error", "fix"],
      design: ["design", "ui", "ux", "look", "feel", "interface"],
    };

    const recentTopics: string[] = [];
    for (const conv of sortedConvs.slice(-10)) {
      const lower = conv.message.toLowerCase();
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some((kw) => lower.includes(kw))) {
          if (!recentTopics.includes(topic)) {
            recentTopics.push(topic);
          }
        }
      }
    }
    const lastTopics = recentTopics.slice(-3);

    const pendingItems = requirements
      .filter((r) => r.status === "PENDING" || r.status === "APPROVED")
      .map((r) => r.title);

    const risks: string[] = [];
    if (project.deadline) {
      const daysUntilDeadline = Math.ceil(
        (project.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) {
        risks.push(`Deadline approaching in ${daysUntilDeadline} days`);
      } else if (daysUntilDeadline <= 0) {
        risks.push("Deadline has passed");
      }
    }
    const pendingReqCount = requirements.filter(
      (r) => r.status === "PENDING" || r.status === "APPROVED"
    ).length;
    if (pendingReqCount > 5) {
      risks.push(`${pendingReqCount} pending requirements not yet implemented`);
    }
    const overdueTasks = tasks.filter(
      (t) => t.deadline && t.deadline < new Date() && t.status !== "DONE"
    );
    if (overdueTasks.length > 0) {
      risks.push(`${overdueTasks.length} overdue tasks`);
    }

    let nextAction: string | null = null;
    if (lastReq && lastReq.status !== "IMPLEMENTED") {
      nextAction = `Implement pending requirement: ${lastReq.title}`;
    } else if (risks.length > 0) {
      nextAction = `Address risk: ${risks[0]}`;
    } else {
      const openTask = tasks.find((t) => t.status !== "DONE");
      if (openTask) {
        nextAction = `Continue work on: ${openTask.title}`;
      }
    }

    const summary = [
      `Project: ${project.title}`,
      `Client: ${project.client.name}`,
      `Status: ${project.status}`,
      `Budget: ${project.budget} ${project.currency || ""}`,
      `Deadline: ${project.deadline?.toISOString().split("T")[0] || "Not set"}`,
      `Open tasks: ${tasks.filter((t) => t.status !== "DONE").length}`,
      `Pending requirements: ${pendingReqCount}`,
      `Recent topics: ${lastTopics.join(", ") || "None"}`,
    ].join(". ");

    try {
      const memory = await prisma.projectMemory.upsert({
        where: { projectId },
        update: {
          summary,
          lastRequirement: lastReq?.title || null,
          lastDiscussion: lastConv?.message?.slice(0, 500) || null,
          nextAction,
          lastTopics,
          pendingItems,
          risks,
        },
        create: {
          projectId,
          summary,
          lastRequirement: lastReq?.title || null,
          lastDiscussion: lastConv?.message?.slice(0, 500) || null,
          nextAction,
          lastTopics,
          pendingItems,
          risks,
        },
      });

      await emit(EventName.MEMORY_UPDATED, { projectId });
      return memory;
    } catch {
      return null;
    }
  }

  async getMemory(projectId: string) {
    const existing = await prisma.projectMemory.findUnique({
      where: { projectId },
    });
    if (existing) return existing;
    return this.buildMemory(projectId);
  }
}
