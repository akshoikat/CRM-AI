import { prisma } from "@crm-ai/db";
import { logger } from "@crm-ai/logger";

export interface ClientPreferenceData {
  clientId: string;
  key: string;
  value: string;
}

export interface HistoricalDecisionData {
  projectId: string;
  decision: string;
  context?: string;
  outcome?: string;
}

export class LongTermMemoryService {
  async setPreference(data: ClientPreferenceData) {
    const existing = await prisma.clientPreference.findFirst({
      where: { clientId: data.clientId, key: data.key },
    });

    if (existing) {
      return prisma.clientPreference.update({
        where: { id: existing.id },
        data: { value: data.value },
      });
    }

    return prisma.clientPreference.create({
      data: {
        clientId: data.clientId,
        key: data.key,
        value: data.value,
      },
    });
  }

  async getPreference(clientId: string, key: string) {
    return prisma.clientPreference.findFirst({
      where: { clientId, key },
    });
  }

  async getAllPreferences(clientId: string) {
    return prisma.clientPreference.findMany({
      where: { clientId },
      orderBy: { key: "asc" },
    });
  }

  async recordDecision(data: HistoricalDecisionData) {
    return prisma.historicalDecision.create({
      data: {
        projectId: data.projectId,
        decision: data.decision,
        context: data.context || null,
        outcome: data.outcome || null,
      },
    });
  }

  async getProjectDecisions(projectId: string) {
    return prisma.historicalDecision.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getClientHistory(clientId: string) {
    const projects = await prisma.project.findMany({
      where: { clientId },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);

    const [decisions, preferences] = await Promise.all([
      prisma.historicalDecision.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      this.getAllPreferences(clientId),
    ]);

    return { decisions, preferences };
  }

  async buildClientContext(clientId: string): Promise<string> {
    const history = await this.getClientHistory(clientId);

    if (history.decisions.length === 0 && history.preferences.length === 0) {
      return "";
    }

    const parts: string[] = [];

    if (history.preferences.length > 0) {
      parts.push("Client Preferences:");
      for (const p of history.preferences) {
        parts.push(`- ${p.key}: ${p.value}`);
      }
    }

    if (history.decisions.length > 0) {
      parts.push("\nHistorical Decisions:");
      for (const d of history.decisions.slice(0, 10)) {
        parts.push(`- ${d.decision}${d.outcome ? ` (Outcome: ${d.outcome})` : ""}`);
      }
    }

    return parts.join("\n");
  }
}
