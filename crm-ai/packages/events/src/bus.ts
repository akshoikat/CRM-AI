import { EventName } from "./names";
import { logger } from "@crm-ai/logger";
import { prisma } from "@crm-ai/db";

export type EventHandler = (payload: unknown) => Promise<void>;

const handlers = new Map<string, EventHandler[]>();
const agentHandlers = new Map<string, Record<string, EventHandler>>();
const pendingRequests = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

async function persistLog(event: string, payload: unknown) {
  try {
    await prisma.eventLog.create({
      data: {
        event,
        entityType: typeof payload === "object" && payload !== null
          ? (payload as Record<string, unknown>).projectId
            ? "project"
            : (payload as Record<string, unknown>).clientId
            ? "client"
            : (payload as Record<string, unknown>).developerId
            ? "developer"
            : "system"
          : "system",
        entityId: typeof payload === "object" && payload !== null
          ? String(
              (payload as Record<string, unknown>).projectId ||
              (payload as Record<string, unknown>).clientId ||
              (payload as Record<string, unknown>).developerId ||
              (payload as Record<string, unknown>).taskId ||
              (payload as Record<string, unknown>).notificationId ||
              (payload as Record<string, unknown>).reminderId ||
              (payload as Record<string, unknown>).requirementId ||
              (payload as Record<string, unknown>).conversationId ||
              ""
            )
          : "",
        payload: payload as Record<string, unknown>,
      },
    });
  } catch (err) {
    logger.error({ err, event }, "Failed to persist EventLog");
  }
}

export function on(event: EventName, handler: EventHandler) {
  const key = event.toString();
  if (!handlers.has(key)) handlers.set(key, []);
  handlers.get(key)!.push(handler);
}

export async function emit(event: EventName, payload: unknown) {
  const key = event.toString();

  await persistLog(key, payload);

  const eventHandlers = handlers.get(key) || [];
  for (const handler of eventHandlers) {
    try {
      await handler(payload);
    } catch (err) {
      logger.error({ err, event: key }, "Event handler failed");
    }
  }

  for (const [agentId, handlerMap] of agentHandlers) {
    const agentHandler = handlerMap[key];
    if (agentHandler) {
      try {
        await agentHandler(payload);
      } catch (err) {
        logger.error({ err, agentId, event: key }, "Agent handler failed");
      }
    }
  }
}

export function register(agentId: string, handlerMap: Record<string, EventHandler>) {
  agentHandlers.set(agentId, handlerMap);
  logger.info({ agentId, handlers: Object.keys(handlerMap) }, "Agent registered with event bus");
}

export async function send(toAgentId: string, event: EventName, payload: unknown) {
  const key = event.toString();
  const handlerMap = agentHandlers.get(toAgentId);

  if (!handlerMap) {
    logger.warn({ toAgentId, event: key }, "send: target agent not registered");
    return;
  }

  const handler = handlerMap[key];
  if (!handler) {
    logger.warn({ toAgentId, event: key }, "send: agent has no handler for this event");
    return;
  }

  await persistLog(key, payload);

  try {
    await handler(payload);
  } catch (err) {
    logger.error({ err, toAgentId, event: key }, "send: agent handler failed");
  }
}

export async function request(
  toAgentId: string,
  event: EventName,
  payload: unknown,
  timeoutMs = 30000
): Promise<unknown> {
  const correlationId = `${event}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      pendingRequests.delete(correlationId);
      reject(new Error(`Request ${correlationId} to ${toAgentId} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  const response = new Promise<unknown>((resolve, reject) => {
    pendingRequests.set(correlationId, { resolve, reject });
  });

  const payloadWithCorrelation = {
    ...(payload as Record<string, unknown>),
    _correlationId: correlationId,
  };

  await send(toAgentId, event, payloadWithCorrelation);

  return Promise.race([response, timeout]);
}

export function respond(correlationId: string, response: unknown) {
  const pending = pendingRequests.get(correlationId);
  if (pending) {
    pendingRequests.delete(correlationId);
    pending.resolve(response);
  } else {
    logger.warn({ correlationId }, "respond: no pending request found");
  }
}

export function unregister(agentId: string) {
  agentHandlers.delete(agentId);
  logger.info({ agentId }, "Agent unregistered from event bus");
}

export function removeAllListeners() {
  handlers.clear();
  agentHandlers.clear();
  pendingRequests.clear();
}
