import twilio from "twilio";
import { logger } from "@crm-ai/logger";

export class WhatsAppClient {
  private client: twilio.Twilio;
  private authToken: string;

  constructor() {
    this.authToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      this.authToken,
    );
  }

  async sendMessage(to: string, body: string) {
    if (!process.env.TWILIO_WHATSAPP_NUMBER) {
      logger.warn("WhatsApp message not sent: TWILIO_WHATSAPP_NUMBER not configured");
      return { success: false, error: "TWILIO_WHATSAPP_NUMBER not configured" };
    }

    try {
      const from = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
      const message = await this.client.messages.create({
        from,
        body,
        to: `whatsapp:${to}`,
      });
      logger.info({ to, messageSid: message.sid }, "WhatsApp message sent");
      return { success: true, messageSid: message.sid };
    } catch (err) {
      logger.error(err, "Failed to send WhatsApp message");
      throw err;
    }
  }

  validateWebhook(
    payload: any,
    headers: Record<string, string | string[] | undefined>,
    webhookUrl: string,
  ): boolean {
    const signature = headers["x-twilio-signature"] as string | undefined;

    if (!signature) {
      logger.warn("WhatsApp webhook validation failed: missing X-Twilio-Signature header");
      return false;
    }

    if (!this.authToken) {
      logger.warn("WhatsApp webhook validation failed: TWILIO_AUTH_TOKEN not configured");
      return false;
    }

    const params = typeof payload === "object" && payload !== null ? payload : {};

    return twilio.validateRequest(this.authToken, signature, webhookUrl, params);
  }

  async handleWebhook(payload: any) {
    try {
      logger.info(
        { from: payload.From, body: payload.Body, messageSid: payload.SmsSid },
        "WhatsApp webhook received",
      );
      return {
        received: true,
        from: payload.From,
        body: payload.Body,
        messageSid: payload.SmsSid,
      };
    } catch (err) {
      logger.error(err, "Failed to handle WhatsApp webhook");
      throw err;
    }
  }
}
