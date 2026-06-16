import { FastifyInstance } from "fastify";
import { ProjectService } from "@crm-ai/projects";
import { handleError } from "../../lib/error-handler";
import { createProjectSchema, updateProjectSchema, updateStatusSchema } from "../../schemas/project.schema";

export async function projectRoutes(app: FastifyInstance) {
  const service = new ProjectService();

  app.get("/projects", async (req, reply) => {
    try {
      return service.findAll();
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/projects/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return service.findById(id);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/clients/:clientId/projects", async (req, reply) => {
    try {
      const { clientId } = req.params as { clientId: string };
      return service.findByClientId(clientId);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/projects", async (req, reply) => {
    try {
      const body = createProjectSchema.parse(req.body);
      return service.create(body);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.put("/projects/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const body = updateProjectSchema.parse(req.body);
      return service.update(id, body);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.patch("/projects/:id/status", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const { status } = updateStatusSchema.parse(req.body);
      return service.updateStatus(id, status);
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
