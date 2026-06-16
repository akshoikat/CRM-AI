import { prisma } from "@crm-ai/db";
import { CreateProjectDto, UpdateProjectDto, ProjectStatus } from "@crm-ai/shared";
import { EventName, emit } from "@crm-ai/events";

export class ProjectService {
  async findAll() {
    return prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true },
    });
  }

  async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        requirements: true,
        conversations: { orderBy: { createdAt: "desc" }, take: 20 },
        tasks: true,
        reminders: true,
        assignments: { include: { developer: true } },
        memory: true,
      },
    });
  }

  async findByClientId(clientId: string) {
    return prisma.project.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(dto: CreateProjectDto) {
    const project = await prisma.project.create({ data: dto });
    await emit(EventName.PROJECT_CREATED, {
      projectId: project.id,
      clientId: project.clientId,
    });
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await prisma.project.update({ where: { id }, data: dto });
    await emit(EventName.PROJECT_UPDATED, { projectId: project.id, changes: dto });
    return project;
  }

  async updateStatus(id: string, status: string) {
    const project = await prisma.project.update({
      where: { id },
      data: { status: status as ProjectStatus },
    });
    return project;
  }
}
