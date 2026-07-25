import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

// 1. Declare a global variable to hold the Prisma instance across hot reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 2. Function to instantiate the client and pool
function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 10, // Increased slightly for Next.js API concurrency
  });

  return new PrismaClient({ adapter });
}

// 3. Reuse the existing client if available, otherwise create a new one
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 4. Save the instance globally in development mode
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
