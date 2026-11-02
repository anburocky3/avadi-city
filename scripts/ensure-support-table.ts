import { prisma } from "../lib/prisma";

async function main() {
  console.log("Checking DB connection and creating support_tickets table if needed...");
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`support_tickets\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NULL,
      \`featureCategory\` ENUM(
        'EXPLORE_PLACES',
        'FOOD_DINING',
        'HOSPITALS_PHARMACIES',
        'LOCAL_SERVICES',
        'RENT_PROPERTIES',
        'JOB_VACANCIES',
        'DONATIONS',
        'TRAVEL_TRANSPORT',
        'LOST_FOUND',
        'SOS',
        'COMPLAINTS',
        'FEED',
        'PROFILE',
        'COMMERCE',
        'TRANSIT',
        'OTHER'
      ) NOT NULL,
      \`subCategory\` VARCHAR(191) NOT NULL,
      \`description\` TEXT NOT NULL,
      \`screenshotUrl\` TEXT NULL,
      \`status\` ENUM('OPEN', 'REVIEWING', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
      \`wardId\` INT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`support_tickets_featureCategory_status_idx\` (\`featureCategory\`, \`status\`),
      INDEX \`support_tickets_userId_idx\` (\`userId\`),
      INDEX \`support_tickets_wardId_idx\` (\`wardId\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  console.log("Table support_tickets ensured!");
  const count = await prisma.supportTicket.count();
  console.log("Support tickets count in DB:", count);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
