import { prisma } from "@crm-ai/db";
import { CreateTaskDto, UpdateTaskDto } from "@crm-ai/shared";
import { EventName, emit } from "@crm-ai/events";

export class TaskService {
  async findByProjectId(projectId: string) {
    return prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: { developer: true },
    });
  }

  async findById(id: string) {
    return prisma.task.findUnique({ where: { id } });
  }

  async create(dto: CreateTaskDto) {
    const task = await prisma.task.create({ data: dto });
    await emit(EventName.TASK_CREATED, {
      projectId: task.projectId,
      taskId: task.id,
      developerId: task.developerId ?? undefined,
    });
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await prisma.task.update({ where: { id }, data: dto });
    if (dto.status === "DONE" || dto.status === "IN_PROGRESS") {
      const event = dto.status === "DONE" ? EventName.TASK_COMPLETED : EventName.TASK_IN_PROGRESS;
      await emit(event, { taskId: task.id, projectId: task.projectId });
    }
    return task;
  }

  async delete(id: string) {
    return prisma.task.delete({ where: { id } });
  }
}
