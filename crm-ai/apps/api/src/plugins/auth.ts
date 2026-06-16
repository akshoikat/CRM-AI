import fjwt from "@fastify/jwt";
import fcookie from "@fastify/cookie";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export async function registerAuth(app: FastifyInstance) {
  await app.register(fcookie);
  await app.register(fjwt, {
    secret: process.env.JWT_SECRET || "dev-secret",
  });
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized" });
  }
}
