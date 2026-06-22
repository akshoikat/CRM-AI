import { prisma } from "@crm-ai/db";
import { logger } from "@crm-ai/logger";
import type { Agent } from "@crm-ai/shared";

export interface AgentSeed {
  id: string;
  username: string;
  displayName: string;
  version: string;
  capabilities: string[];
  permissions?: { can: string[]; cannot: string[] };
  description?: string;
}

const SEED_AGENTS: AgentSeed[] = [
  {
    id: "AG-0001",
    username: "coordinator",
    displayName: "Coordinator Agent",
    version: "1.0.0",
    capabilities: [
      "event:route",
      "memory:build",
      "project:read",
      "project:write",
      "agent:coordinate",
    ],
    permissions: {
      can: ["read:project", "write:memory", "emit:event"],
      cannot: ["delete:project"],
    },
    description: "Central event router. Receives domain events and orchestrates memory rebuilds.",
  },
  {
    id: "AG-0002",
    username: "conversation",
    displayName: "Conversation Agent",
    version: "1.0.0",
    capabilities: [
      "project:read",
      "conversation:write",
      "memory:update",
      "requirement:write",
      "intent:detect",
      "response:generate",
    ],
    permissions: {
      can: [
        "read:project",
        "write:conversation",
        "update:memory",
        "detect:intent",
        "generate:response",
      ],
      cannot: ["delete:project"],
    },
    description:
      "Processes client messages, detects intent, generates context-aware responses via DeepSeek AI.",
  },
  {
    id: "AG-0003",
    username: "reminder",
    displayName: "Reminder Agent",
    version: "1.0.0",
    capabilities: [
      "project:read",
      "reminder:manage",
      "deadline:monitor",
      "notification:send",
    ],
    permissions: {
      can: ["read:project", "manage:reminder", "monitor:deadline"],
      cannot: ["write:project", "delete:project"],
    },
    description:
      "Scans project deadlines within 3-day windows and processes due reminders.",
  },
  {
    id: "AG-0004",
    username: "assignment",
    displayName: "Assignment Agent",
    version: "1.0.0",
    capabilities: [
      "project:read",
      "developer:read",
      "assignment:write",
      "skill:match",
    ],
    permissions: {
      can: ["read:project", "read:developers", "write:assignment", "match:skills"],
      cannot: ["delete:project"],
    },
    description:
      "Matches project requirements to developer skills and auto-assigns the best candidate.",
  },
  {
    id: "AG-0005",
    username: "estimate",
    displayName: "Estimate Agent",
    version: "1.0.0",
    capabilities: [
      "project:read",
      "estimate:generate",
      "cost:calculate",
      "risk:analyze",
    ],
    permissions: {
      can: ["read:project", "generate:estimate", "calculate:cost", "analyze:risk"],
      cannot: ["write:project", "delete:project"],
    },
    description:
      "Analyzes project requirements and provides time, cost, team size, and risk estimates via AI.",
  },
  {
    id: "AG-0006",
    username: "finance",
    displayName: "Finance Agent",
    version: "1.0.0",
    capabilities: [
      "project:read",
      "budget:monitor",
      "invoice:generate",
      "payment:track",
    ],
    permissions: {
      can: ["read:project", "monitor:budget", "generate:invoice", "track:payment"],
      cannot: ["delete:project", "write:requirement"],
    },
    description:
      "Monitors project budgets, generates invoices, tracks payments, and detects budget overruns.",
  },
  {
    id: "AG-0007",
    username: "meeting",
    displayName: "Meeting Agent",
    version: "1.0.0",
    capabilities: [
      "project:read",
      "meeting:schedule",
      "agenda:generate",
      "followup:create",
    ],
    permissions: {
      can: ["read:project", "schedule:meeting", "generate:agenda", "create:followup"],
      cannot: ["delete:project"],
    },
    description:
      "Generates meeting agendas, schedules project kickoffs, and creates follow-up task lists.",
  },
  {
    id: "AG-0008",
    username: "qa",
    displayName: "QA Agent",
    version: "1.0.0",
    capabilities: [
      "project:read",
      "task:review",
      "bug:track",
      "quality:report",
    ],
    permissions: {
      can: ["read:project", "review:task", "track:bug", "report:quality"],
      cannot: ["delete:project", "write:task"],
    },
    description:
      "Reviews completed tasks, runs quality checklists, tracks bugs, and generates quality reports.",
  },
];

export class AgentRegistryService {
  async register(agent: AgentSeed): Promise<Agent> {
    const existing = await prisma.agent.findUnique({
      where: { id: agent.id },
    });
    if (existing) {
      return prisma.agent.update({
        where: { id: agent.id },
        data: {
          username: agent.username,
          displayName: agent.displayName,
          version: agent.version,
          capabilities: agent.capabilities,
          permissions: agent.permissions ?? existing.permissions,
          description: agent.description ?? existing.description,
        },
      }) as unknown as Agent;
    }

    return prisma.agent.create({
      data: {
        id: agent.id,
        username: agent.username,
        displayName: agent.displayName,
        version: agent.version,
        capabilities: agent.capabilities,
        permissions: agent.permissions ?? null,
        description: agent.description ?? null,
      },
    }) as unknown as Agent;
  }

  async seedAll(): Promise<Agent[]> {
    const results: Agent[] = [];
    for (const seed of SEED_AGENTS) {
      try {
        const agent = await this.register(seed);
        results.push(agent);
        logger.info({ agentId: agent.id, username: agent.username }, "Agent registered");
      } catch (err) {
        logger.error({ err, agentId: seed.id }, "Failed to seed agent");
      }
    }
    logger.info({ count: results.length }, "Agent seeding complete");
    return results;
  }

  async findById(id: string): Promise<Agent | null> {
    return prisma.agent.findUnique({ where: { id } }) as unknown as Agent | null;
  }

  async findByUsername(username: string): Promise<Agent | null> {
    return prisma.agent.findUnique({
      where: { username },
    }) as unknown as Agent | null;
  }

  async findAll(): Promise<Agent[]> {
    return prisma.agent.findMany({
      orderBy: { id: "asc" },
    }) as unknown as Agent[];
  }

  async getCapabilities(agentId: string): Promise<string[]> {
    const agent = await this.findById(agentId);
    return (agent?.capabilities as string[]) || [];
  }

  async hasPermission(
    agentId: string,
    permission: string
  ): Promise<boolean> {
    const agent = await this.findById(agentId);
    if (!agent?.permissions) return false;
    const perms = agent.permissions as { can: string[]; cannot: string[] };
    if (perms.cannot?.includes(permission)) return false;
    return perms.can?.includes(permission) ?? false;
  }

  async update(
    id: string,
    data: Partial<AgentSeed>
  ): Promise<Agent | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    return prisma.agent.update({
      where: { id },
      data: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.version && { version: data.version }),
        ...(data.capabilities && { capabilities: data.capabilities }),
        ...(data.permissions && { permissions: data.permissions }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
      },
    }) as unknown as Agent;
  }

  async setStatus(id: string, status: string): Promise<Agent | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    return prisma.agent.update({
      where: { id },
      data: { status },
    }) as unknown as Agent;
  }
}
