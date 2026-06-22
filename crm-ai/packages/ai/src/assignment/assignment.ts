import { prisma } from "@crm-ai/db";
import {
  EventName,
  register,
  send,
  emit,
  respond,
} from "@crm-ai/events";
import { logger } from "@crm-ai/logger";
import { DeveloperStatus, AssignmentStatus } from "@crm-ai/shared";

const AGENT_ID = "AG-0004";

const SKILL_KEYWORDS: Record<string, string[]> = {
  FRONTEND: ["react", "vue", "angular", "html", "css", "javascript", "typescript", "ui", "ux", "frontend", "tailwind", "component", "responsive"],
  BACKEND: ["node", "express", "python", "django", "api", "database", "postgres", "sql", "mongodb", "server", "backend", "rest", "graphql", "prisma", "microservice"],
  FULLSTACK: ["fullstack", "full stack", "end to end", "both frontend and backend"],
  DESIGNER: ["design", "figma", "sketch", "illustrator", "ui", "ux", "wireframe", "prototype", "mockup"],
  QA: ["testing", "qa", "quality", "test", "automation", "cypress", "playwright", "selenium", "unit test", "integration test"],
};

function extractRequiredSkills(description: string): string[] {
  const lower = description.toLowerCase();
  const skills: string[] = [];
  for (const [role, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      skills.push(role);
    }
  }
  return skills.length > 0 ? skills : ["FULLSTACK"];
}

function matchDevelopers(
  developers: any[],
  requiredSkills: string[]
): { developer: any; score: number }[] {
  return developers
    .map((dev) => {
      const devSkills: string[] = Array.isArray(dev.skills)
        ? dev.skills
        : typeof dev.skills === "string"
        ? dev.skills.split(",").map((s: string) => s.trim())
        : [];
      const matchCount = requiredSkills.filter((rs) =>
        devSkills.some((ds: string) => ds.toUpperCase() === rs)
      ).length;
      const score =
        matchCount + (dev.availability ? 2 : 0) + (dev.status === "ACTIVE" ? 1 : 0);
      return { developer: dev, score };
    })
    .sort((a, b) => b.score - a.score);
}

export class AssignmentAgent {
  constructor() {
    register(AGENT_ID, {
      [EventName.NEW_REQUIREMENT_DETECTED]: this.onNewRequirement.bind(this),
      [EventName.PROJECT_CREATED]: this.onProjectCreated.bind(this),
      [EventName.AGENT_REQUEST_RECEIVED]: this.onRequest.bind(this),
    });
    logger.info({ agentId: AGENT_ID }, "AssignmentAgent registered");
  }

  private async onNewRequirement(payload: any) {
    const { projectId } = payload;
    logger.info({ projectId }, "AssignmentAgent: evaluating requirement for assignment");
    await this.evaluateAssignment(projectId);
  }

  private async onProjectCreated(payload: any) {
    const { projectId } = payload;
    logger.info({ projectId }, "AssignmentAgent: new project — checking for assignment");
    await this.evaluateAssignment(projectId);
  }

  private async onRequest(payload: any) {
    const { _correlationId, projectId, force } = payload;
    if (!_correlationId) return;
    try {
      const result = await this.evaluateAssignment(projectId);
      respond(_correlationId, { success: true, result });
    } catch (err: any) {
      respond(_correlationId, { success: false, error: err.message });
    }
  }

  async evaluateAssignment(projectId: string): Promise<string | null> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { requirements: { take: 5, orderBy: { createdAt: "desc" } } },
      });
      if (!project) return null;

      const statement = project.statement || project.description || "";
      const requirementTexts = project.requirements.map((r) => r.title + " " + (r.description || "")).join(" ");
      const combined = statement + " " + requirementTexts;

      const requiredSkills = extractRequiredSkills(combined);
      logger.info({ projectId, requiredSkills }, "Required skills detected");

      const developers = await prisma.developer.findMany({
        where: {
          status: { in: [DeveloperStatus.ACTIVE, DeveloperStatus.BUSY] },
          availability: true,
        },
      });

      if (developers.length === 0) {
        logger.info({ projectId }, "No available developers");
        return null;
      }

      const matches = matchDevelopers(developers, requiredSkills);
      const bestMatch = matches[0];

      if (!bestMatch || bestMatch.score < 1) {
        logger.info({ projectId }, "No suitable developer match found");
        return null;
      }

      const existing = await prisma.assignment.findFirst({
        where: { projectId, developerId: bestMatch.developer.id },
      });
      if (existing) {
        logger.info({ projectId, developerId: bestMatch.developer.id }, "Developer already assigned");
        return existing.id;
      }

      const role = requiredSkills[0] || "FULLSTACK";

      const assignment = await prisma.assignment.create({
        data: {
          projectId,
          developerId: bestMatch.developer.id,
          role: role as any,
          status: AssignmentStatus.ACTIVE,
        },
      });

      logger.info(
        {
          projectId,
          developerId: bestMatch.developer.id,
          developerName: bestMatch.developer.name,
          role,
          score: bestMatch.score,
        },
        "AssignmentAgent: developer auto-assigned"
      );

      await emit(EventName.DEVELOPER_ASSIGNED, {
        projectId,
        developerId: bestMatch.developer.id,
        assignmentId: assignment.id,
      });

      return assignment.id;
    } catch (err) {
      logger.error({ err, projectId }, "AssignmentAgent: evaluation failed");
      return null;
    }
  }
}
