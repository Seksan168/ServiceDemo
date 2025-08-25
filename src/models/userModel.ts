// src/models/userModel.ts
import { PrismaClient, User } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["warn", "error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// What your API returns to clients
export type PublicUserDTO = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string; // string ISO
  updatedAt: string; // string ISO
};

// Helper: convert Prisma User (with Date) -> DTO (with string)
function toDTO(u: Pick<User, "id" | "name" | "email" | "role" | "createdAt" | "updatedAt">): PublicUserDTO {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: String(u.role),
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

export async function createUser(name: string, email: string, password: string): Promise<PublicUserDTO> {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("Email already in use");

  const passwordHash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "USER" },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  return toDTO(user);
}

export async function verifyUser(email: string, password: string): Promise<PublicUserDTO | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true, passwordHash: true },
  });
  if (!user) return null;

  const ok = await Bun.password.verify(password, user.passwordHash);
  if (!ok) return null;

  // strip hash + serialize dates
  const { passwordHash, ...safe } = user;
  return toDTO(safe);
}

export async function getUserById(id: string): Promise<PublicUserDTO | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });
  return user ? toDTO(user) : null;
}
