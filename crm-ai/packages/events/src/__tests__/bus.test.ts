import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@crm-ai/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { on, emit, removeAllListeners } from "../bus";
import { EventName } from "../names";

describe("EventBus", () => {
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
