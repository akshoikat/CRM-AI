import { FastifyInstance } from "fastify";
import { prisma } from "@crm-ai/db";
import { handleError } from "../../lib/error-handler";
import { createNotificationSchema } from "../../schemas/notification.schema";

export async function notificationRoutes(app: FastifyInstance) {
  app.get("/notifications", async (req, reply) => {
    try {
      return prisma.notification.findMany({ orderBy: { createdAt: "desc" } });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/notifications/:receiverId", async (req, reply) => {
    try {
      const { receiverId } = req.params as { receiverId: string };
      return prisma.notification.findMany({
        where: { receiverId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/notifications", async (req, reply) => {
    try {
      const body = createNotificationSchema.parse(req.body);
      return prisma.notification.create({
        data: {
          receiverType: body.receiverType as any,
          receiverId: body.receiverId,
          channel: body.channel as any,
          title: body.title,
          body: body.body,
        },
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.put("/notifications/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return prisma.notification.update({ where: { id }, data: req.body as any });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.delete("/notifications/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      return prisma.notification.delete({ where: { id } });
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
