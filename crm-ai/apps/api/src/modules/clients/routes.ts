import { FastifyInstance } from "fastify";
import { ClientService } from "@crm-ai/clients";
import { handleError } from "../../lib/error-handler";
import { createClientSchema, updateClientSchema } from "../../schemas/client.schema";

export async function clientRoutes(app: FastifyInstance) {
  const service = new ClientService();

  app.get("/clients", async (req, reply) => {
    try {
      return service.findAll();
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/clients/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return service.findById(id);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/clients", async (req, reply) => {
    try {
      const body = createClientSchema.parse(req.body);
      return service.create(body);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.put("/clients/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const body = updateClientSchema.parse(req.body);
      return service.update(id, body);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.delete("/clients/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return service.archive(id);
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
