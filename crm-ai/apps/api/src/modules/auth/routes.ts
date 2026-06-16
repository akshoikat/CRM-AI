import { FastifyInstance } from "fastify";
import { AuthService } from "@crm-ai/auth";
import { authenticate } from "../../plugins/auth";
import { handleError } from "../../lib/error-handler";

export async function authRoutes(app: FastifyInstance) {
  const service = new AuthService();

  app.post("/register", async (req, reply) => {
    try {
      const { name, email, password } = req.body as {
        name: string;
        email: string;
        password: string;
      };
      if (!name || !email || !password) {
        return reply.status(400).send({ error: "Name, email, and password are required" });
      }
      const user = await service.register(email, password, name);
      return reply.status(201).send({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    } catch (error: any) {
      if (error.message === "Email already exists") {
        return reply.status(409).send({ error: error.message });
      }
      return handleError(reply, error);
    }
  });

  app.post("/login", async (req, reply) => {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };
      if (!email || !password) {
        return reply.status(400).send({ error: "Email and password are required" });
      }
      const user = await service.validateLogin(email, password);
      if (!user) {
        return reply.status(401).send({ error: "Invalid email or password" });
      }
      const token = app.jwt.sign({ id: user.id, email: user.email });
      return { token, user };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get(
    "/me",
    { preHandler: [authenticate] },
    async (req, reply) => {
      try {
        const { id } = req.user as { id: string };
        const user = await service.findById(id);
        if (!user) {
          return reply.status(404).send({ error: "User not found" });
        }
        return user;
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );
}
