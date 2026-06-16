import { FastifyInstance } from "fastify";
import { DeveloperService } from "@crm-ai/developers";
import { handleError } from "../../lib/error-handler";
import { createDeveloperSchema, updateDeveloperSchema } from "../../schemas/developer.schema";

export async function developerRoutes(app: FastifyInstance) {
  const service = new DeveloperService();

  app.get("/developers", async (req, reply) => {
    try {
      return service.findAll();
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/developers/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return service.findById(id);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/developers", async (req, reply) => {
    try {
      const body = createDeveloperSchema.parse(req.body);
      return service.create(body);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.put("/developers/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const body = updateDeveloperSchema.parse(req.body);
      return service.update(id, body);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/developers/available", async (req, reply) => {
    try {
      return service.findByAvailability();
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
