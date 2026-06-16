import { FastifyInstance } from "fastify";
import { AssignmentService } from "@crm-ai/assignments";
import { handleError } from "../../lib/error-handler";

export async function assignmentRoutes(app: FastifyInstance) {
  const service = new AssignmentService();

  app.get("/assignments", async (req, reply) => {
    try {
      const { projectId, developerId } = req.query as { projectId?: string; developerId?: string };
      return service.findAll({ projectId, developerId });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/assignments", async (req, reply) => {
    try {
      const { projectId, developerId, role } = req.body as { projectId: string; developerId: string; role: string };
      return service.create({ projectId, developerId, role });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.put("/assignments/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const { role, status } = req.body as { role?: string; status?: string };
      return service.update(id, { role, status });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.delete("/assignments/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return service.delete(id);
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
