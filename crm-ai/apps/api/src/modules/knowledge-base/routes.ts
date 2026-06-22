import { FastifyInstance } from "fastify";
import { KnowledgeBaseService } from "@crm-ai/knowledge-base";
import { VectorSearchService } from "@crm-ai/vector-search";
import { LongTermMemoryService } from "@crm-ai/memory";
import { handleError } from "../../lib/error-handler";

export async function knowledgeBaseRoutes(app: FastifyInstance) {
  const kb = new KnowledgeBaseService();
  const vs = new VectorSearchService();
  const ltm = new LongTermMemoryService();

  app.get("/knowledge-base", async (req, reply) => {
    try {
      const { category } = req.query as { category?: string };
      return kb.findAll(category);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/knowledge-base/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const doc = await kb.findById(id);
      if (!doc) return reply.status(404).send({ error: "Document not found" });
      return doc;
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/knowledge-base", async (req, reply) => {
    try {
      const body = req.body as any;
      const doc = await kb.create(body);
      return doc;
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.put("/knowledge-base/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as any;
      const doc = await kb.update(id, body);
      if (!doc) return reply.status(404).send({ error: "Document not found" });
      return doc;
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.delete("/knowledge-base/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      await kb.delete(id);
      return { deleted: true };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/knowledge-base/tag/:tag", async (req, reply) => {
    try {
      const { tag } = req.params as { tag: string };
      return kb.findByTag(tag);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/vector-search/index/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const success = await vs.embedAndIndexDocument(id);
      return { success };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/vector-search/index-all", async (req, reply) => {
    try {
      const count = await vs.embedAllDocuments();
      return { indexed: count };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/vector-search/search", async (req, reply) => {
    try {
      const { q, topK } = req.query as { q: string; topK?: string };
      if (!q) return reply.status(400).send({ error: "Query 'q' is required" });
      const results = await vs.search(q, topK ? Number(topK) : 5);
      return { results };
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/memory/client-preferences", async (req, reply) => {
    try {
      const { clientId, key, value } = req.body as {
        clientId: string;
        key: string;
        value: string;
      };
      const result = await ltm.setPreference({ clientId, key, value });
      return result;
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/memory/client-preferences/:clientId", async (req, reply) => {
    try {
      const { clientId } = req.params as { clientId: string };
      return ltm.getAllPreferences(clientId);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/memory/decisions", async (req, reply) => {
    try {
      const body = req.body as {
        projectId: string;
        decision: string;
        context?: string;
        outcome?: string;
      };
      const result = await ltm.recordDecision(body);
      return result;
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/memory/client-history/:clientId", async (req, reply) => {
    try {
      const { clientId } = req.params as { clientId: string };
      const history = await ltm.getClientHistory(clientId);
      return history;
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
