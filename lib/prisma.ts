import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/generated/prisma/client";

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
    port: Number(process.env.DATABASE_PORT) || 3306,
    // ✅ Increased pool size — Next.js dev + Turbopack creates many concurrent requests
    connectionLimit: 20,
    // ✅ How long (ms) to wait for a free connection from the pool before throwing
    acquireTimeout: 15000,
    // ✅ How long (ms) to wait when establishing a new TCP connection to the DB
    connectTimeout: 10000,
    // ✅ Keep idle connections alive so they don't go stale
    idleTimeout: 60000,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

// 3. Reuse the existing client if available, otherwise create a new one
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 4. Save the instance globally in development mode to survive hot reloads
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 5. Graceful shutdown — release all pool connections on process exit
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
  process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
