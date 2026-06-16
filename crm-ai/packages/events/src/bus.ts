import { EventName } from "./names";
import { logger } from "@crm-ai/logger";

export type EventHandler = (payload: unknown) => Promise<void>;

const handlers = new Map<string, EventHandler[]>();

export function on(event: EventName, handler: EventHandler) {
  const key = event.toString();
  if (!handlers.has(key)) handlers.set(key, []);
  handlers.get(key)!.push(handler);
}

export async function emit(event: EventName, payload: unknown) {
  const key = event.toString();
  const eventHandlers = handlers.get(key) || [];
  for (const handler of eventHandlers) {
    try {
      await handler(payload);
    } catch (err) {
      logger.error({ err, event: key }, "Event handler failed");
    }
  }
}

export function removeAllListeners() {
  handlers.clear();
}
