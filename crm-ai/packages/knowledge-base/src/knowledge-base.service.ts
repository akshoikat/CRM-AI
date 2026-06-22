import { prisma } from "@crm-ai/db";
import { logger } from "@crm-ai/logger";

export interface CreateDocumentInput {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  embedding?: number[];
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  embedding?: number[];
}

export class KnowledgeBaseService {
  async create(input: CreateDocumentInput) {
    return prisma.document.create({
      data: {
        title: input.title,
        content: input.content,
        category: input.category || "GENERAL",
        tags: input.tags || [],
        embedding: input.embedding || null,
      },
    });
  }

  async findById(id: string) {
    return prisma.document.findUnique({ where: { id } });
  }

  async findAll(category?: string) {
    const where = category ? { category } : {};
    return prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, input: UpdateDocumentInput) {
    return prisma.document.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.embedding !== undefined && { embedding: input.embedding }),
      },
    });
  }

  async delete(id: string) {
    return prisma.document.delete({ where: { id } });
  }

  async findByTag(tag: string) {
    const docs = await prisma.document.findMany();
    return docs.filter((d) => {
      const tags = (d.tags as string[]) || [];
      return tags.includes(tag);
    });
  }

  async getDocumentEmbeddings() {
    const docs = await prisma.document.findMany({
      where: { embedding: { not: null } },
      select: { id: true, title: true, content: true, embedding: true, category: true, tags: true },
    });
    return docs.map((d) => ({
      ...d,
      embedding: d.embedding as number[],
    }));
  }
}
