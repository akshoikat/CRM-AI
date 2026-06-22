import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { EventName, on } from "@crm-ai/events";
import { logger } from "@crm-ai/logger";

const sseClients = new Set<FastifyReply>();

export function broadcastSSE(event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.raw.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

export async function sseRoutes(app: FastifyInstance) {
  app.get("/events/stream", async (req, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    reply.raw.write(`event: connected\ndata: {}\n\n`);

    sseClients.add(reply);

    req.raw.on("close", () => {
      sseClients.delete(reply);
    });
  });
}

on(EventName.CLIENT_CREATED, (payload) => broadcastSSE("CLIENT_CREATED", payload));
on(EventName.PROJECT_CREATED, (payload) => broadcastSSE("PROJECT_CREATED", payload));
on(EventName.TASK_CREATED, (payload) => broadcastSSE("TASK_CREATED", payload));
on(EventName.TASK_COMPLETED, (payload) => broadcastSSE("TASK_COMPLETED", payload));
on(EventName.DEVELOPER_ASSIGNED, (payload) => broadcastSSE("DEVELOPER_ASSIGNED", payload));
on(EventName.CLIENT_MESSAGE_RECEIVED, (payload) => broadcastSSE("CLIENT_MESSAGE_RECEIVED", payload));
on(EventName.CLIENT_MESSAGE_SENT, (payload) => broadcastSSE("CLIENT_MESSAGE_SENT", payload));
on(EventName.DEADLINE_APPROACHING, (payload) => broadcastSSE("DEADLINE_APPROACHING", payload));
on(EventName.REMINDER_TRIGGERED, (payload) => broadcastSSE("REMINDER_TRIGGERED", payload));
on(EventName.MEMORY_UPDATED, (payload) => broadcastSSE("MEMORY_UPDATED", payload));
on(EventName.AGENT_REGISTERED, (payload) => broadcastSSE("AGENT_REGISTERED", payload));

logger.info("SSE broadcast registered on 11 event types");
