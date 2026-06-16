import { google } from "googleapis";
import { logger } from "@crm-ai/logger";

export class GmailClient {
  private gmail;

  constructor() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
    this.gmail = google.gmail({ version: "v1", auth: oauth2Client });
  }

  async sendEmail(to: string, subject: string, body: string) {
    try {
      const utf8Bytes = Buffer.from(
        `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}`,
        "utf-8",
      );
      const raw = utf8Bytes.toString("base64url");
      const res = await this.gmail.users.messages.send({
        userId: process.env.GMAIL_USER || "me",
        requestBody: { raw },
      });
      logger.info({ to, subject, messageId: res.data.id }, "Email sent");
      return { success: true, messageId: res.data.id };
    } catch (err) {
      logger.error(err, "Failed to send email");
      throw err;
    }
  }

  validateWebhook(payload: any, _headers: Record<string, string | string[] | undefined>): boolean {
    if (!payload || typeof payload !== "object") {
      logger.warn("Gmail webhook validation failed: payload is not an object");
      return false;
    }

    if (!payload.message || !payload.subscription) {
      logger.warn(
        { hasMessage: !!payload.message, hasSubscription: !!payload.subscription },
        "Gmail webhook validation failed: missing required fields (message, subscription)",
      );
      return false;
    }

    const message = payload.message;
    if (!message.data || !message.messageId) {
      logger.warn("Gmail webhook validation failed: message missing data or messageId");
      return false;
    }

    return true;
  }

  async handleWebhook(payload: any) {
    try {
      logger.info({ historyId: payload.historyId }, "Gmail webhook received");
      return { received: true, historyId: payload.historyId };
    } catch (err) {
      logger.error(err, "Failed to handle Gmail webhook");
      throw err;
    }
  }
}
