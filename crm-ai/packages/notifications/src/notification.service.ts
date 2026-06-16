import { prisma } from "@crm-ai/db";
import { emailQueue, whatsappQueue } from "@crm-ai/queue";
import { EventName, emit } from "@crm-ai/events";
import { ReceiverType, NotificationChannel } from "@crm-ai/shared";
import { logger } from "@crm-ai/logger";
import { createTransport } from "nodemailer";
import { WhatsAppClient } from "@crm-ai/whatsapp";

export class NotificationService {
  private transporter = createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });

  private whatsappClient = new WhatsAppClient();

  async sendEmail(receiverId: string, title: string, body: string) {
    const notification = await prisma.notification.create({
      data: {
        receiverType: ReceiverType.CLIENT,
        receiverId,
        channel: NotificationChannel.EMAIL,
        title,
        body,
      },
    });

    await emailQueue.add("send-email", {
      notificationId: notification.id,
      to: receiverId,
      subject: title,
      body,
    });

    await emit(EventName.EMAIL_NOTIFICATION_SENT, {
      notificationId: notification.id,
      receiverId,
    });

    return notification;
  }

  async sendWhatsApp(receiverId: string, title: string, body: string) {
    const notification = await prisma.notification.create({
      data: {
        receiverType: ReceiverType.CLIENT,
        receiverId,
        channel: NotificationChannel.WHATSAPP,
        title,
        body,
      },
    });

    await whatsappQueue.add("send-whatsapp", {
      notificationId: notification.id,
      to: receiverId,
      body: `${title}\n\n${body}`,
    });

    await emit(EventName.WHATSAPP_NOTIFICATION_SENT, {
      notificationId: notification.id,
      receiverId,
    });

    return notification;
  }

  async processEmail(notificationId: string, to: string, subject: string, body: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@crm-ai.com",
        to,
        subject,
        text: body,
      });
      logger.info({ notificationId, to, subject }, "Email sent successfully");
      await this.markSent(notificationId);
    } catch (error) {
      logger.error({ notificationId, to, error }, "Failed to send email");
      await this.markFailed(notificationId);
    }
  }

  async processWhatsApp(notificationId: string, to: string, body: string) {
    try {
      await this.whatsappClient.sendMessage(to, body);
      logger.info({ notificationId, to }, "WhatsApp sent successfully");
      await this.markSent(notificationId);
    } catch (error) {
      logger.error({ notificationId, to, error }, "Failed to send WhatsApp");
      await this.markFailed(notificationId);
    }
  }

  async markSent(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });
  }

  async markFailed(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: "FAILED" },
    });
  }
}
