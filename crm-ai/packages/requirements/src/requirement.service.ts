import { RequirementSource, RequirementStatus } from "@crm-ai/shared";
import { prisma } from "@crm-ai/db";
import { EventName, emit } from "@crm-ai/events";

export class RequirementService {
  async findByProjectId(projectId: string) {
    return prisma.requirement.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    projectId: string;
    title: string;
    description?: string;
    source?: string;
  }) {
    const requirement = await prisma.requirement.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        source: (data.source as RequirementSource) || RequirementSource.CLIENT,
      },
    });
    await emit(EventName.REQUIREMENT_CREATED, {
      projectId: requirement.projectId,
      requirementId: requirement.id,
    });
    return requirement;
  }

  async updateStatus(id: string, status: string) {
    return prisma.requirement.update({
      where: { id },
      data: { status: status as RequirementStatus },
    });
  }

  async update(id: string, data: any) {
    return prisma.requirement.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.requirement.delete({ where: { id } });
  }
}
