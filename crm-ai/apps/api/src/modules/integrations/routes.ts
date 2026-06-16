import { FastifyInstance } from "fastify";
import { GmailClient } from "@crm-ai/gmail";
import { WhatsAppClient } from "@crm-ai/whatsapp";
import { handleError } from "../../lib/error-handler";
import { gmailSendSchema, whatsappSendSchema } from "../../schemas/integration.schema";

export async function integrationRoutes(app: FastifyInstance) {
  const gmail = new GmailClient();
  const whatsapp = new WhatsAppClient();

  app.post("/integrations/gmail/webhook", async (req, reply) => {
    try {
      const payload = req.body as any;
      return gmail.handleWebhook(payload);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/integrations/whatsapp/webhook", async (req, reply) => {
    try {
      const payload = req.body as any;
      return whatsapp.handleWebhook(payload);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/integrations/gmail/send", async (req, reply) => {
    try {
      const { to, subject, body } = gmailSendSchema.parse(req.body);
      return gmail.sendEmail(to, subject, body);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/integrations/whatsapp/send", async (req, reply) => {
    try {
      const { to, body } = whatsappSendSchema.parse(req.body);
      return whatsapp.sendMessage(to, body);
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
