import { FastifyInstance } from "fastify";
import { ConversationAgent } from "@crm-ai/ai";
import { prisma } from "@crm-ai/db";
import { handleError } from "../../lib/error-handler";
import { sendMessageSchema } from "../../schemas/conversation.schema";

export async function conversationRoutes(app: FastifyInstance) {
  const agent = new ConversationAgent();

  app.get("/conversations", async (req, reply) => {
    try {
      const { projectId } = req.query as { projectId: string };
      if (!projectId) return reply.status(400).send({ error: "projectId is required" });
      return prisma.conversation.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/conversations/message", async (req, reply) => {
    try {
      const body = sendMessageSchema.parse(req.body);
      return agent.processMessage({
        projectId: body.projectId,
        message: body.message || body.content,
        channel: body.channel || "DASHBOARD",
        senderType: body.sender === "User" ? "CLIENT" : body.sender || "CLIENT",
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
