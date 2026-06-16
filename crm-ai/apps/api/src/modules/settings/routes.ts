import { FastifyInstance } from "fastify";
import { handleError } from "../../lib/error-handler";

function maskValue(value: string | undefined): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  const visible = value.slice(0, 4) + "••••" + value.slice(-4);
  return visible;
}

function isConfigured(value: string | undefined): boolean {
  return !!value && value.length > 0;
}

export async function settingsRoutes(app: FastifyInstance) {
  app.get("/settings", async (_req, reply) => {
    try {
      const settings = {
        deepseek: {
          key: maskValue(process.env.DEEPSEEK_API_KEY),
          baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
          model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
          configured: isConfigured(process.env.DEEPSEEK_API_KEY),
        },
        smtp: {
          host: process.env.SMTP_HOST || "localhost",
          port: process.env.SMTP_PORT || "587",
          user: maskValue(process.env.SMTP_USER),
          pass: maskValue(process.env.SMTP_PASS),
          from: process.env.SMTP_FROM || "noreply@crm-ai.local",
          configured: isConfigured(process.env.SMTP_USER) && isConfigured(process.env.SMTP_PASS),
        },
        gmail: {
          clientId: maskValue(process.env.GMAIL_CLIENT_ID),
          clientSecret: maskValue(process.env.GMAIL_CLIENT_SECRET),
          refreshToken: maskValue(process.env.GMAIL_REFRESH_TOKEN),
          user: process.env.GMAIL_USER || "",
          configured:
            isConfigured(process.env.GMAIL_CLIENT_ID) &&
            isConfigured(process.env.GMAIL_CLIENT_SECRET) &&
            isConfigured(process.env.GMAIL_REFRESH_TOKEN),
        },
        whatsapp: {
          accountSid: maskValue(process.env.TWILIO_ACCOUNT_SID),
          authToken: maskValue(process.env.TWILIO_AUTH_TOKEN),
          fromNumber: maskValue(process.env.TWILIO_WHATSAPP_NUMBER),
          configured:
            isConfigured(process.env.TWILIO_ACCOUNT_SID) &&
            isConfigured(process.env.TWILIO_AUTH_TOKEN) &&
            isConfigured(process.env.TWILIO_WHATSAPP_NUMBER),
        },
        jwt: {
          secret: maskValue(process.env.JWT_SECRET),
          configured: isConfigured(process.env.JWT_SECRET),
        },
        admin: {
          email: process.env.ADMIN_EMAIL || "admin@crm-ai.local",
          password: maskValue(process.env.ADMIN_PASSWORD),
          configured: isConfigured(process.env.ADMIN_EMAIL) && isConfigured(process.env.ADMIN_PASSWORD),
        },
      };

      return reply.send({ settings });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/settings/test", async (req, reply) => {
    try {
      const { service } = req.body as { service: string };
      const results: Record<string, { status: string; message: string }> = {};

      if (!service || service === "deepseek") {
        try {
          const key = process.env.DEEPSEEK_API_KEY;
          if (!key) throw new Error("DEEPSEEK_API_KEY not configured");

          const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
          const response = await fetch(`${baseUrl}/v1/models`, {
            headers: { Authorization: `Bearer ${key}` },
          });
          results.deepseek = response.ok
            ? { status: "ok", message: "DeepSeek API connection successful" }
            : { status: "failed", message: `DeepSeek API returned ${response.status}` };
        } catch (err: any) {
          results.deepseek = { status: "failed", message: err.message };
        }
      }

      if (!service || service === "smtp") {
        try {
          const nodemailer = await import("nodemailer");
          const transport = nodemailer.default.createTransport({
            host: process.env.SMTP_HOST || "localhost",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
          await transport.verify();
          results.smtp = { status: "ok", message: "SMTP connection successful" };
        } catch (err: any) {
          results.smtp = { status: "failed", message: err.message };
        }
      }

      if (!service || service === "gmail") {
        try {
          const clientId = process.env.GMAIL_CLIENT_ID;
          const clientSecret = process.env.GMAIL_CLIENT_SECRET;
          const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

          if (!clientId || !clientSecret || !refreshToken) {
            throw new Error("Gmail credentials not fully configured");
          }

          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: refreshToken,
              grant_type: "refresh_token",
            }).toString(),
          });

          results.gmail = response.ok
            ? { status: "ok", message: "Gmail OAuth token refresh successful" }
            : { status: "failed", message: `Gmail OAuth returned ${response.status}` };
        } catch (err: any) {
          results.gmail = { status: "failed", message: err.message };
        }
      }

      if (!service || service === "whatsapp") {
        try {
          const sid = process.env.TWILIO_ACCOUNT_SID;
          const token = process.env.TWILIO_AUTH_TOKEN;

          if (!sid || !token) {
            throw new Error("Twilio credentials not fully configured");
          }

          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${sid}.json`,
            {
              headers: {
                Authorization:
                  "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
              },
            }
          );

          results.whatsapp = response.ok
            ? { status: "ok", message: "WhatsApp/Twilio API connection successful" }
            : { status: "failed", message: `Twilio API returned ${response.status}` };
        } catch (err: any) {
          results.whatsapp = { status: "failed", message: err.message };
        }
      }

      return reply.send({ results });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/settings/env", async (_req, reply) => {
    try {
      const envVars: { name: string; value: string; configured: boolean }[] = [
        { name: "DEEPSEEK_API_KEY", value: maskValue(process.env.DEEPSEEK_API_KEY), configured: isConfigured(process.env.DEEPSEEK_API_KEY) },
        { name: "DEEPSEEK_BASE_URL", value: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com", configured: true },
        { name: "DEEPSEEK_MODEL", value: process.env.DEEPSEEK_MODEL || "deepseek-chat", configured: true },
        { name: "SMTP_HOST", value: process.env.SMTP_HOST || "localhost", configured: true },
        { name: "SMTP_PORT", value: process.env.SMTP_PORT || "587", configured: true },
        { name: "SMTP_USER", value: maskValue(process.env.SMTP_USER), configured: isConfigured(process.env.SMTP_USER) },
        { name: "SMTP_PASS", value: maskValue(process.env.SMTP_PASS), configured: isConfigured(process.env.SMTP_PASS) },
        { name: "SMTP_FROM", value: process.env.SMTP_FROM || "noreply@crm-ai.local", configured: true },
        { name: "GMAIL_CLIENT_ID", value: maskValue(process.env.GMAIL_CLIENT_ID), configured: isConfigured(process.env.GMAIL_CLIENT_ID) },
        { name: "GMAIL_CLIENT_SECRET", value: maskValue(process.env.GMAIL_CLIENT_SECRET), configured: isConfigured(process.env.GMAIL_CLIENT_SECRET) },
        { name: "GMAIL_REFRESH_TOKEN", value: maskValue(process.env.GMAIL_REFRESH_TOKEN), configured: isConfigured(process.env.GMAIL_REFRESH_TOKEN) },
        { name: "GMAIL_USER", value: process.env.GMAIL_USER || "", configured: isConfigured(process.env.GMAIL_USER) },
        { name: "TWILIO_ACCOUNT_SID", value: maskValue(process.env.TWILIO_ACCOUNT_SID), configured: isConfigured(process.env.TWILIO_ACCOUNT_SID) },
        { name: "TWILIO_AUTH_TOKEN", value: maskValue(process.env.TWILIO_AUTH_TOKEN), configured: isConfigured(process.env.TWILIO_AUTH_TOKEN) },
        { name: "TWILIO_WHATSAPP_NUMBER", value: maskValue(process.env.TWILIO_WHATSAPP_NUMBER), configured: isConfigured(process.env.TWILIO_WHATSAPP_NUMBER) },
        { name: "JWT_SECRET", value: maskValue(process.env.JWT_SECRET), configured: isConfigured(process.env.JWT_SECRET) },
        { name: "ADMIN_EMAIL", value: process.env.ADMIN_EMAIL || "admin@crm-ai.local", configured: true },
        { name: "ADMIN_PASSWORD", value: maskValue(process.env.ADMIN_PASSWORD), configured: isConfigured(process.env.ADMIN_PASSWORD) },
      ];

      return reply.send({ envVars });
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
