import { prisma } from "../lib/prisma";

async function main() {
  console.log("Checking and applying missing database tables and columns...");

  // 1. Check & add isAdmin column to users table
  try {
    const cols = await prisma.$queryRawUnsafe<any[]>("SHOW COLUMNS FROM `users` LIKE 'isAdmin'");
    if (cols.length === 0) {
      console.log("Adding `isAdmin` column to `users` table...");
      await prisma.$executeRawUnsafe(
        "ALTER TABLE `users` ADD COLUMN `isAdmin` TINYINT(1) NOT NULL DEFAULT 0"
      );
      console.log("✅ `isAdmin` column added to `users`.");
    } else {
      console.log("ℹ️ `isAdmin` column already exists on `users`.");
    }
  } catch (err) {
    console.error("Error updating `users` table:", err);
  }

  // 2. Check & add imageUrl column to lost_found_claims table
  try {
    const claimCols = await prisma.$queryRawUnsafe<any[]>("SHOW COLUMNS FROM `lost_found_claims` LIKE 'imageUrl'");
    if (claimCols.length === 0) {
      console.log("Adding `imageUrl` column to `lost_found_claims` table...");
      await prisma.$executeRawUnsafe(
        "ALTER TABLE `lost_found_claims` ADD COLUMN `imageUrl` VARCHAR(191) NULL"
      );
      console.log("✅ `imageUrl` column added to `lost_found_claims`.");
    } else {
      console.log("ℹ️ `imageUrl` column already exists on `lost_found_claims`.");
    }
  } catch (err) {
    console.error("Error updating `lost_found_claims` table:", err);
  }

  // 3. Create community_listings table
  try {
    console.log("Ensuring `community_listings` table...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`community_listings\` (
        \`id\`              VARCHAR(191) NOT NULL,
        \`type\`            ENUM('EXPLORE_PLACE','FOOD_DINING','HEALTHCARE') NOT NULL,
        \`name\`            VARCHAR(191) NOT NULL,
        \`subCategory\`     VARCHAR(191) NULL,
        \`description\`     TEXT         NOT NULL,
        \`address\`         VARCHAR(191) NOT NULL,
        \`ward\`            INT          NULL,
        \`timings\`         VARCHAR(191) NULL,
        \`is24x7\`          TINYINT(1)   NOT NULL DEFAULT 0,
        \`phone\`           VARCHAR(191) NULL,
        \`imageUrl\`        VARCHAR(191) NULL,
        \`googleMapsUrl\`   VARCHAR(191) NULL,
        \`extraDetails\`    JSON         NULL,
        \`status\`          ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
        \`rejectionReason\` VARCHAR(191) NULL,
        \`submittedById\`   VARCHAR(191) NOT NULL,
        \`reviewedById\`    VARCHAR(191) NULL,
        \`reviewedAt\`      DATETIME(3)  NULL,
        \`createdAt\`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`cl_submittedById_fkey\`
          FOREIGN KEY (\`submittedById\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX \`cl_type_status_idx\` (\`type\`, \`status\`),
        INDEX \`cl_ward_idx\` (\`ward\`),
        INDEX \`cl_submittedById_idx\` (\`submittedById\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ `community_listings` table ensured.");
  } catch (err) {
    console.error("Error creating `community_listings` table:", err);
    throw err;
  }

  // 4. Create job_listings table
  try {
    console.log("Ensuring `job_listings` table...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`job_listings\` (
        \`id\`            VARCHAR(191) NOT NULL,
        \`role\`          VARCHAR(191) NOT NULL,
        \`businessName\`  VARCHAR(191) NOT NULL,
        \`jobType\`       VARCHAR(50)  NOT NULL DEFAULT 'Full-Time',
        \`salary\`        VARCHAR(100) NOT NULL,
        \`shift\`         VARCHAR(100) NULL,
        \`contact\`       VARCHAR(20)  NOT NULL,
        \`location\`      TEXT         NULL,
        \`ward\`          INT          NOT NULL,
        \`details\`       TEXT         NOT NULL,
        \`requirements\`  JSON         NULL,
        \`submittedById\` VARCHAR(191) NULL,
        \`createdAt\`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`job_listings_submittedById_fkey\`
          FOREIGN KEY (\`submittedById\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX \`job_listings_ward_idx\` (\`ward\`),
        INDEX \`job_listings_jobType_idx\` (\`jobType\`),
        INDEX \`job_listings_submittedById_idx\` (\`submittedById\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ `job_listings` table ensured.");
  } catch (err) {
    console.error("Error creating `job_listings` table:", err);
    throw err;
  }

  // 5. Create volunteer_posts table
  try {
    console.log("Ensuring `volunteer_posts` table...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`volunteer_posts\` (
        \`id\`              VARCHAR(191) NOT NULL,
        \`type\`            VARCHAR(191) NOT NULL,
        \`title\`           VARCHAR(191) NOT NULL,
        \`organization\`    VARCHAR(191) NULL,
        \`category\`        VARCHAR(100) NOT NULL,
        \`description\`     TEXT         NOT NULL,
        \`targetAmount\`    DECIMAL(10, 2) NULL,
        \`collectedAmount\` DECIMAL(10, 2) NULL DEFAULT 0.00,
        \`urgency\`         VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
        \`contactPerson\`   VARCHAR(100) NOT NULL,
        \`contactPhone\`    VARCHAR(20)  NOT NULL,
        \`contactEmail\`    VARCHAR(100) NULL,
        \`location\`        VARCHAR(191) NOT NULL,
        \`ward\`            VARCHAR(50)  NULL,
        \`imageUrl\`        TEXT         NULL,
        \`upiId\`           VARCHAR(100) NULL,
        \`status\`          VARCHAR(191) NOT NULL DEFAULT 'PENDING',
        \`rejectionReason\` TEXT         NULL,
        \`submittedById\`   VARCHAR(191) NULL,
        \`reviewedById\`    VARCHAR(191) NULL,
        \`reviewedAt\`      DATETIME(3)  NULL,
        \`createdAt\`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`volunteer_posts_submittedById_fkey\`
          FOREIGN KEY (\`submittedById\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX \`volunteer_posts_type_idx\` (\`type\`),
        INDEX \`volunteer_posts_status_idx\` (\`status\`),
        INDEX \`volunteer_posts_category_idx\` (\`category\`),
        INDEX \`volunteer_posts_submittedById_idx\` (\`submittedById\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✅ `volunteer_posts` table ensured.");
  } catch (err) {
    console.error("Error creating `volunteer_posts` table:", err);
    throw err;
  }

  // 6. Ensure rental_listings.submittedById
  try {
    const rentalCols = await prisma.$queryRawUnsafe<any[]>("SHOW COLUMNS FROM `rental_listings` LIKE 'submittedById'");
    if (rentalCols.length === 0) {
      console.log("Adding `submittedById` column to `rental_listings` table...");
      await prisma.$executeRawUnsafe(
        "ALTER TABLE `rental_listings` ADD COLUMN `submittedById` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL"
      );
      await prisma.$executeRawUnsafe(
        "ALTER TABLE `rental_listings` ADD INDEX `rental_listings_submittedById_idx` (`submittedById`)"
      );
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`rental_listings\` ADD CONSTRAINT \`rental_listings_submittedById_fkey\`
          FOREIGN KEY (\`submittedById\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log("✅ `submittedById` column and FK added to `rental_listings`.");
    } else {
      console.log("ℹ️ `submittedById` already exists on `rental_listings`.");
    }
  } catch (err) {
    console.error("Error updating `rental_listings` table:", err);
  }

  console.log("All missing tables and columns successfully applied!");
}

main()
  .catch((err) => {
    console.error("Failed applying missing tables:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
