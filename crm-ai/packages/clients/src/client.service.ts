import { prisma } from "@crm-ai/db";
import { CreateClientDto, UpdateClientDto, ClientStatus } from "@crm-ai/shared";
import { EventName, emit } from "@crm-ai/events";

export class ClientService {
  async findAll() {
    return prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: { projects: true },
    });
  }

  async create(dto: CreateClientDto) {
    const client = await prisma.client.create({ data: dto });
    await emit(EventName.CLIENT_CREATED, { clientId: client.id });
    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    const client = await prisma.client.update({ where: { id }, data: dto });
    await emit(EventName.CLIENT_UPDATED, { clientId: client.id });
    return client;
  }

  async archive(id: string) {
    const client = await prisma.client.update({
      where: { id },
      data: { status: ClientStatus.ARCHIVED },
    });
    await emit(EventName.CLIENT_ARCHIVED, { clientId: client.id });
    return client;
  }

  async delete(id: string) {
    return prisma.client.delete({ where: { id } });
  }
}
