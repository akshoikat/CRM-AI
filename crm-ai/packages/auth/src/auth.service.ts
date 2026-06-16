import bcrypt from "bcryptjs";
import { prisma } from "@crm-ai/db";

export class AuthService {
  async register(email: string, password: string, name: string) {
    const exists = await prisma.developer.findUnique({ where: { email } });
    if (exists) throw new Error("Email already exists");
    const hash = await bcrypt.hash(password, 10);
    return prisma.developer.create({
      data: { name, email, password: hash },
    });
  }

  async validateLogin(email: string, password: string) {
    const user = await prisma.developer.findUnique({ where: { email } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, (user as any).password || "");
    if (!valid) return null;
    return { id: user.id, email: user.email, name: user.name };
  }

  async findById(id: string) {
    return prisma.developer.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
  }
}
