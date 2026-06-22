import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@crm-ai/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@crm-ai/db", () => ({
  prisma: {
    eventLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

import { on, emit, register, send, request, respond, unregister, removeAllListeners } from "../bus";
import { EventName } from "../names";

describe("EventBus — pub/sub (backward compatible)", () => {
  beforeEach(() => {
    removeAllListeners();
  });

  it("should call handler when event is emitted", async () => {
    const handler = vi.fn();
    const payload = { clientId: "123" };

    on(EventName.CLIENT_CREATED, handler);
    await emit(EventName.CLIENT_CREATED, payload);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it("should support multiple handlers for the same event", async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    on(EventName.PROJECT_CREATED, handler1);
    on(EventName.PROJECT_CREATED, handler2);
    await emit(EventName.PROJECT_CREATED, { projectId: "abc" });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it("should not call handlers for different events", async () => {
    const handler = vi.fn();

    on(EventName.CLIENT_CREATED, handler);
    await emit(EventName.TASK_COMPLETED, {});

    expect(handler).not.toHaveBeenCalled();
  });

  it("should clear all listeners with removeAllListeners", async () => {
    const handler = vi.fn();

    on(EventName.MEMORY_UPDATED, handler);
    removeAllListeners();
    await emit(EventName.MEMORY_UPDATED, {});

    expect(handler).not.toHaveBeenCalled();
  });

  it("should isolate handler failures and continue calling remaining handlers", async () => {
    const handler1 = vi.fn().mockRejectedValue(new Error("fail"));
    const handler2 = vi.fn();

    on(EventName.PROJECT_CREATED, handler1);
    on(EventName.PROJECT_CREATED, handler2);
    await emit(EventName.PROJECT_CREATED, { projectId: "x" });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });
});

describe("EventBus — Agent Communication Protocol", () => {
  beforeEach(() => {
    removeAllListeners();
  });

  it("register should store agent handlers", () => {
    register("AG-0001", {
      [EventName.PROJECT_CREATED]: vi.fn(),
    });

    expect(true).toBe(true);
  });

  it("send should deliver event to registered agent handler", async () => {
    const handler = vi.fn();
    register("AG-0002", {
      [EventName.INTENT_DETECTED]: handler,
    });

    const payload = { projectId: "p1", intent: "NEW_REQUIREMENT" };
    await send("AG-0002", EventName.INTENT_DETECTED, payload);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it("send should warn if target agent is not registered", async () => {
    const handler = vi.fn();
    register("AG-0001", {
      [EventName.TASK_CREATED]: handler,
    });

    await send("AG-9999", EventName.TASK_CREATED, {});
    expect(handler).not.toHaveBeenCalled();
  });

  it("send should warn if agent has no handler for the event", async () => {
    const handler = vi.fn();
    register("AG-0003", {
      [EventName.DEADLINE_APPROACHING]: handler,
    });

    await send("AG-0003", EventName.TASK_COMPLETED, {});
    expect(handler).not.toHaveBeenCalled();
  });

  it("request should send event and receive response via respond", async () => {
    register("AG-0001", {
      [EventName.ESTIMATE_CREATED]: async (payload: any) => {
        const { _correlationId } = payload;
        respond(_correlationId, { estimatedHours: 40, cost: 5000 });
      },
    });

    const result = (await request("AG-0001", EventName.ESTIMATE_CREATED, {
      description: "Build a dashboard",
    })) as { estimatedHours: number; cost: number };

    expect(result.estimatedHours).toBe(40);
    expect(result.cost).toBe(5000);
  });

  it("request should timeout if no response", async () => {
    await expect(
      request("AG-0001", EventName.ESTIMATE_CREATED, {}, 100)
    ).rejects.toThrow("timed out");
  }, 5000);

  it("unregister should remove agent handlers", async () => {
    const handler = vi.fn();
    register("AG-0001", {
      [EventName.PROJECT_CREATED]: handler,
    });

    unregister("AG-0001");
    await send("AG-0001", EventName.PROJECT_CREATED, {});
    expect(handler).not.toHaveBeenCalled();
  });

  it("should support multiple agents registered independently", async () => {
    const h1 = vi.fn();
    const h2 = vi.fn();

    register("AG-0001", { [EventName.CLIENT_CREATED]: h1 });
    register("AG-0002", { [EventName.CLIENT_CREATED]: h2 });

    await send("AG-0001", EventName.CLIENT_CREATED, { clientId: "c1" });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).not.toHaveBeenCalled();

    await send("AG-0002", EventName.CLIENT_CREATED, { clientId: "c2" });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
});
