// lib/prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
// Reutiliza una sola instancia en dev (Hot Reload)
const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    // log: ['query', 'error', 'warn'], // opcional para debug
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}



export default prisma;
