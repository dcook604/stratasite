import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

let prisma = null;

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
