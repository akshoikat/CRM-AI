import { FastifyReply } from "fastify";
import { ZodError } from "zod";
import { logger } from "@crm-ai/logger";

export function handleError(reply: FastifyReply, error: unknown) {
  if (error instanceof ZodError) {
    return reply.status(400).send({ error: "Validation failed", details: error.errors });
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  const code = (error as any)?.code || "INTERNAL_ERROR";
  logger.error({ err: error }, message);
  return reply.status(500).send({ error: message, code });
}
