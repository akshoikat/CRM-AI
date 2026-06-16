import { prisma } from "@crm-ai/db";
import { CreateDeveloperDto } from "@crm-ai/shared";

export class DeveloperService {
  async findAll() {
    return prisma.developer.findMany({ orderBy: { name: "asc" } });
  }

  async findById(id: string) {
    return prisma.developer.findUnique({
      where: { id },
      include: {
        assignments: { include: { project: true } },
        tasks: true,
      },
    });
  }

  async create(dto: CreateDeveloperDto) {
    return prisma.developer.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateDeveloperDto>) {
    return prisma.developer.update({ where: { id }, data: dto });
  }

  async findByAvailability() {
    return prisma.developer.findMany({
      where: { availability: true, status: "ACTIVE" },
    });
  }
}
