import { describe, it, expect } from "vitest";
import { ClientStatus, ProjectStatus, TaskStatus, SenderType } from "../enums";

describe("ClientStatus enum", () => {
  it("should have three status values", () => {
    expect(Object.keys(ClientStatus)).toHaveLength(3);
  });

  it("should have ACTIVE value", () => {
    expect(ClientStatus.ACTIVE).toBe("ACTIVE");
  });

  it("should have ARCHIVED value", () => {
    expect(ClientStatus.ARCHIVED).toBe("ARCHIVED");
  });
});

describe("ProjectStatus enum", () => {
  it("should contain DRAFT", () => {
    expect(ProjectStatus.DRAFT).toBe("DRAFT");
  });

  it("should contain COMPLETED", () => {
    expect(ProjectStatus.COMPLETED).toBe("COMPLETED");
  });
});

describe("TaskStatus enum", () => {
  it("should have TODO as first status", () => {
    expect(TaskStatus.TODO).toBe("TODO");
  });

  it("should have DONE as final status", () => {
    expect(TaskStatus.DONE).toBe("DONE");
  });

  it("should have exactly 4 statuses", () => {
    expect(Object.keys(TaskStatus)).toHaveLength(4);
  });
});

describe("SenderType enum", () => {
  it("should include CLIENT and AGENT", () => {
    expect(SenderType.CLIENT).toBe("CLIENT");
    expect(SenderType.AGENT).toBe("AGENT");
  });
});
