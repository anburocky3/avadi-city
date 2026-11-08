import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client";

// Import your data modules
import {
  adminUsers,
  corporationUsers,
  regularUsers,
} from "./seed-data/users.seed";
import { seedPlaces } from "./seed-data/places.seed";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT) || 3306,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Seed Core System Account
  const systemUser = await prisma.user.upsert({
    where: { id: "seed_avadi_city" },
    update: {},
    create: {
      id: "seed_avadi_city",
      name: "Avadi City",
      gender: "Other",
      dob: new Date("2000-01-01"),
      bloodGroup: "O_POS",
      phone: "9000000000",
      email: "hello@avadi.city",
      wardNumber: 14,
      streetName: "Avadi City",
      notificationEnabled: true,
      isVerified: true,
    },
  });

  // 2. Bulk Seed Users (Admin, Corp, Regular)
  const allUsersToSeed = [...adminUsers, ...corporationUsers, ...regularUsers];
  console.log(`👤 Seeding ${allUsersToSeed.length} users...`);

  for (const user of allUsersToSeed) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {}, // Leave empty to avoid overwriting modified dev data, or pass updates
      create: {
        ...user,
        gender: "Male",
        dob: new Date("1995-05-15"),
        bloodGroup: "A_POS",
        streetName: "Avadi Main Rd",
        notificationEnabled: true,
        isVerified: true,
      },
    });
  }

  // 3. Seed Feeds (Depends on systemUser)
  await prisma.feed.upsert({
    where: { id: "seed_welcome_feed" },
    update: {},
    create: {
      id: "seed_welcome_feed",
      authorId: systemUser.id,
      ward: 14,
      text: "Welcome to Avadi City. Find civic updates, local services, and community support in one place.",
      category: "general",
      isEmergency: false,
    },
  });

  // 4. Seed Independent Tables (Places)
  console.log(`📍 Seeding ${seedPlaces.length} locations...`);
  for (const place of seedPlaces) {
    await prisma.explorePlace.upsert({
      where: { id: place.id },
      update: {},
      create: place,
    });
  }

  console.log("✅ Database seeding completed successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Prisma seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
