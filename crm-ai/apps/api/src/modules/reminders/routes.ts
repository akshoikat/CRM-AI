import { FastifyInstance } from "fastify";
import { ReminderService } from "@crm-ai/reminders";
import { handleError } from "../../lib/error-handler";
import { createReminderSchema } from "../../schemas/reminder.schema";

export async function reminderRoutes(app: FastifyInstance) {
  const service = new ReminderService();

  app.get("/projects/:projectId/reminders", async (req, reply) => {
    try {
      const { projectId } = req.params as { projectId: string };
      return service.findByProjectId(projectId);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/reminders", async (req, reply) => {
    try {
      const body = createReminderSchema.parse(req.body);
      const type = body.type || "DEADLINE";
      const scheduleAt = body.scheduleAt
        ? new Date(body.scheduleAt)
        : body.dueDate
          ? new Date(body.dueDate)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return service.create({
        projectId: body.projectId,
        type,
        scheduleAt,
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.put("/reminders/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return service.update(id, req.body);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.delete("/reminders/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return service.delete(id);
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
