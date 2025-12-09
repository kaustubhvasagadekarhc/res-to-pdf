import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = global.prisma || new PrismaClient({
  adapter,
  log: ['error', 'warn']
});

if (!global.prisma) global.prisma = prisma;

export default prisma;