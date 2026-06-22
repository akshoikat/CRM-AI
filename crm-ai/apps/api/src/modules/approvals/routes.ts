import { FastifyInstance } from "fastify";
import { prisma } from "@crm-ai/db";
import { EventName, emit } from "@crm-ai/events";
import { handleError } from "../../lib/error-handler";

export async function approvalRoutes(app: FastifyInstance) {
  app.get("/approvals", async (req, reply) => {
    try {
      const { status } = req.query as { status?: string };
      const where = status ? { status } : {};
      return prisma.pendingApproval.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/approvals/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const approval = await prisma.pendingApproval.findUnique({ where: { id } });
      if (!approval) return reply.status(404).send({ error: "Approval not found" });
      return approval;
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.post("/approvals", async (req, reply) => {
    try {
      const body = req.body as {
        type: string;
        entityType: string;
        entityId: string;
        data: any;
        requestedBy: string;
        reason?: string;
      };
      const approval = await prisma.pendingApproval.create({
        data: {
          type: body.type,
          entityType: body.entityType,
          entityId: body.entityId,
          data: body.data,
          requestedBy: body.requestedBy,
          reason: body.reason || null,
        },
      });
      return reply.status(201).send(approval);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.patch("/approvals/:id/approve", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const { approvedBy } = req.body as { approvedBy: string };

      const approval = await prisma.pendingApproval.update({
        where: { id },
        data: { status: "APPROVED", approvedBy, reviewedAt: new Date() },
      });

      if (approval.type === "BUDGET_CHANGE") {
        await emit(EventName.BUDGET_UPDATED, {
          projectId: approval.entityId,
          changes: approval.data as Record<string, unknown>,
        });
      } else if (approval.type === "DEVELOPER_ASSIGNMENT") {
        await emit(EventName.DEVELOPER_ASSIGNED, approval.data as any);
      } else if (approval.type === "INVOICE") {
        await emit(EventName.INVOICE_GENERATED, approval.data as any);
      }

      return approval;
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.patch("/approvals/:id/reject", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const { approvedBy, reason } = req.body as { approvedBy: string; reason?: string };
      return prisma.pendingApproval.update({
        where: { id },
        data: { status: "REJECTED", approvedBy, reason: reason || null, reviewedAt: new Date() },
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  app.get("/approvals/stats/summary", async (req, reply) => {
    try {
      const [pending, approved, rejected] = await Promise.all([
        prisma.pendingApproval.count({ where: { status: "PENDING" } }),
        prisma.pendingApproval.count({ where: { status: "APPROVED" } }),
        prisma.pendingApproval.count({ where: { status: "REJECTED" } }),
      ]);
      return { pending, approved, rejected, total: pending + approved + rejected };
    } catch (error) {
      return handleError(reply, error);
    }
  });
}
