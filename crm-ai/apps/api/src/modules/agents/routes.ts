import { FastifyInstance } from "fastify";
import { AgentRegistryService } from "@crm-ai/agents-registry";
import { handleError } from "../../lib/error-handler";

export async function agentRoutes(app: FastifyInstance) {
  const service = new AgentRegistryService();

  app.get("/agents", async (req, reply) => {
    try {
      return service.findAll();
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/agents/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const agent = await service.findById(id);
      if (!agent) {
        return reply.status(404).send({ error: "Agent not found" });
      }
      return agent;
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/agents/seed", async (req, reply) => {
    try {
      const agents = await service.seedAll();
      return { agents, count: agents.length };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.put("/agents/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as Record<string, unknown>;
      const agent = await service.update(id, body);
      if (!agent) {
        return reply.status(404).send({ error: "Agent not found" });
      }
      return agent;
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.patch("/agents/:id/status", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const { status } = req.body as { status: string };
      const agent = await service.setStatus(id, status);
      if (!agent) {
        return reply.status(404).send({ error: "Agent not found" });
      }
      return agent;
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
