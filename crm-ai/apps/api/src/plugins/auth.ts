import fjwt from "@fastify/jwt";
import fcookie from "@fastify/cookie";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export async function registerAuth(app: FastifyInstance) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required");
    }
    app.log.warn("WARNING: JWT_SECRET not set — using dev-secret (not for production!)");
  }
  await app.register(fcookie);
  await app.register(fjwt, {
    secret: jwtSecret || "dev-secret",
    sign: { expiresIn: "24h" },
  });
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
}
