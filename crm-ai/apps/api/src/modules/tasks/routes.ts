import { FastifyInstance } from "fastify";
import { TaskService } from "@crm-ai/tasks";
import { handleError } from "../../lib/error-handler";
import { createTaskSchema, updateTaskSchema } from "../../schemas/task.schema";

export async function taskRoutes(app: FastifyInstance) {
  const service = new TaskService();

  app.get("/projects/:projectId/tasks", async (req, reply) => {
    try {
      const { projectId } = req.params as { projectId: string };
      return service.findByProjectId(projectId);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/tasks/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return service.findById(id);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/tasks", async (req, reply) => {
    try {
      const body = createTaskSchema.parse(req.body);
      return service.create(body);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.put("/tasks/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const body = updateTaskSchema.parse(req.body);
      return service.update(id, body);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.delete("/tasks/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return service.delete(id);
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
