import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"]
});

/**
 * Check database connection by running a simple query
 */
export async function checkDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("✓ Database connected successfully");
  } catch (error) {
    console.error("✗ Database connection failed:", error instanceof Error ? error.message : error);
    throw error;
  }
}

export default prisma;
