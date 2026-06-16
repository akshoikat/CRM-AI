import { prisma } from "@crm-ai/db";

export class AssignmentService {
  async findAll(filters?: { projectId?: string; developerId?: string }) {
    return prisma.assignment.findMany({
      where: {
        ...(filters?.projectId && { projectId: filters.projectId }),
        ...(filters?.developerId && { developerId: filters.developerId }),
      },
      include: { project: true, developer: true },
    });
  }

  async findById(id: string) {
    return prisma.assignment.findUnique({
      where: { id },
      include: { project: true, developer: true },
    });
  }

  async create(data: { projectId: string; developerId: string; role: string }) {
    return prisma.assignment.create({ data: data as any });
  }

  async update(id: string, data: { role?: string; status?: string }) {
    return prisma.assignment.update({ where: { id }, data: data as any });
  }

  async delete(id: string) {
    return prisma.assignment.delete({ where: { id } });
  }
}
