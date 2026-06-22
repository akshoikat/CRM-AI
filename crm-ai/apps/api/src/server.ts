import Fastify from "fastify";
import cors from "@fastify/cors";
import { logger } from "@crm-ai/logger";
import { registerAuth, authenticate } from "./plugins/auth";
import {
  authRoutes,
  clientRoutes,
  projectRoutes,
  developerRoutes,
  taskRoutes,
  requirementRoutes,
  reminderRoutes,
  conversationRoutes,
  notificationRoutes,
  integrationRoutes,
  assignmentRoutes,
  settingsRoutes,
  agentRoutes,
  aiRoutes,
  knowledgeBaseRoutes,
  approvalRoutes,
  sseRoutes,
} from "./modules";
import {
  CoordinatorAgent,
  AssignmentAgent,
  FinanceAgent,
  QAAgent,
  MeetingAgent,
  EstimateAgent,
} from "@crm-ai/ai";
import { AgentRegistryService } from "@crm-ai/agents-registry";

async function main() {
  const app = Fastify({ logger: false });

  new CoordinatorAgent();
  new AssignmentAgent();
  new FinanceAgent();
  new QAAgent();
  new MeetingAgent();
  new EstimateAgent();

  logger.info("All 6 agents registered with event bus");

  await app.register(cors, { origin: true, credentials: true });
  await registerAuth(app);

  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  await app.register(authRoutes, { prefix: "/api/auth" });

  await app.register(
    async (api) => {
      api.addHook("preHandler", authenticate);
      await api.register(clientRoutes);
      await api.register(projectRoutes);
      await api.register(developerRoutes);
      await api.register(taskRoutes);
      await api.register(requirementRoutes);
      await api.register(reminderRoutes);
      await api.register(conversationRoutes);
      await api.register(notificationRoutes);
      await api.register(integrationRoutes);
      await api.register(assignmentRoutes);
      await api.register(settingsRoutes);
      await api.register(agentRoutes);
      await api.register(aiRoutes);
      await api.register(knowledgeBaseRoutes);
      await api.register(approvalRoutes);
      await api.register(sseRoutes);
    },
    { prefix: "/api" }
  );

  const agentRegistry = new AgentRegistryService();
  agentRegistry.seedAll().catch((err) => {
    logger.warn({ err }, "Agent seeding failed (non-fatal)");
  });

  const port = Number(process.env.PORT) || 4000;

  try {
    await app.listen({ port, host: "0.0.0.0" });
    logger.info({ port }, "API server started");
  } catch (err) {
    logger.error(err, "Failed to start API server");
    process.exit(1);
  }
}

main();
