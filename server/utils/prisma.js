import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

let prisma = null;

export function getPrisma() {
  if (!prisma) {
    const libsql = createClient({
      url: process.env.DATABASE_URL,
    });
    const adapter = new PrismaLibSQL(libsql);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}
