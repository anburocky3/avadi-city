import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema/",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL
      ? env("DATABASE_URL")
      : "mysql://placeholder:placeholder@localhost:3306/placeholder",
  },
});
