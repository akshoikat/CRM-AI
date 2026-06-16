import { FastifyInstance } from "fastify";
import { RequirementService } from "@crm-ai/requirements";
import { handleError } from "../../lib/error-handler";
import { createRequirementSchema, updateRequirementStatusSchema } from "../../schemas/requirement.schema";

export async function requirementRoutes(app: FastifyInstance) {
  const service = new RequirementService();

  app.get("/projects/:projectId/requirements", async (req, reply) => {
    try {
      const { projectId } = req.params as { projectId: string };
      return service.findByProjectId(projectId);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/requirements", async (req, reply) => {
    try {
      const body = createRequirementSchema.parse(req.body);
      return service.create(body);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.patch("/requirements/:id/status", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const { status } = updateRequirementStatusSchema.parse(req.body);
      return service.updateStatus(id, status);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.put("/requirements/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return service.update(id, req.body);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.delete("/requirements/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return service.delete(id);
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
