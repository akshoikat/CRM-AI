import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  client: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@crm-ai/db", () => ({ prisma: mockPrisma }));
vi.mock("@crm-ai/events", () => ({ emit: vi.fn(), EventName: { CLIENT_CREATED: "CLIENT_CREATED", CLIENT_UPDATED: "CLIENT_UPDATED", CLIENT_ARCHIVED: "CLIENT_ARCHIVED" } }));

import { ClientService } from "../client.service";

describe("ClientService", () => {
  let service: ClientService;

  beforeEach(() => {
    service = new ClientService();
    vi.clearAllMocks();
  });

  it("should list clients", async () => {
    const mockClients = [
      { id: "1", name: "Acme Corp", email: "acme@test.com" },
      { id: "2", name: "Globex", email: "globex@test.com" },
    ];
    mockPrisma.client.findMany.mockResolvedValue(mockClients);

    const result = await service.findAll();

    expect(mockPrisma.client.findMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockClients);
    expect(result).toHaveLength(2);
  });

  it("should find a client by id", async () => {
    const mockClient = {
      id: "1",
      name: "Acme Corp",
      email: "acme@test.com",
      projects: [],
    };
    mockPrisma.client.findUnique.mockResolvedValue(mockClient);

    const result = await service.findById("1");

    expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      include: { projects: true },
    });
    expect(result).toEqual(mockClient);
  });

  it("should create a new client", async () => {
    const dto = { name: "New Client", email: "new@test.com" };
    const created = { id: "3", ...dto };
    mockPrisma.client.create.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(mockPrisma.client.create).toHaveBeenCalledWith({ data: dto });
    expect(result).toEqual(created);
  });

  it("should delete a client", async () => {
    const deleted = { id: "1", name: "Acme Corp" };
    mockPrisma.client.delete.mockResolvedValue(deleted);

    const result = await service.delete("1");

    expect(mockPrisma.client.delete).toHaveBeenCalledWith({ where: { id: "1" } });
    expect(result).toEqual(deleted);
  });
});
