-- CreateTable: community_listings
-- This migration was missing from the tracked migrations history.
-- The schema defined CommunityListing but the table was never created via prisma migrate.

CREATE TABLE `community_listings` (
  `id`              VARCHAR(191)                            NOT NULL,
  `type`            ENUM('EXPLORE_PLACE','FOOD_DINING','HEALTHCARE') NOT NULL,
  `name`            VARCHAR(191)                            NOT NULL,
  `subCategory`     VARCHAR(191)                            NULL,
  `description`     TEXT                                    NOT NULL,
  `address`         VARCHAR(191)                            NOT NULL,
  `ward`            INT                                     NULL,
  `timings`         VARCHAR(191)                            NULL,
  `is24x7`          TINYINT(1)                              NOT NULL DEFAULT 0,
  `phone`           VARCHAR(191)                            NULL,
  `imageUrl`        VARCHAR(191)                            NULL,
  `googleMapsUrl`   VARCHAR(191)                            NULL,
  `extraDetails`    JSON                                    NULL,
  `status`          ENUM('PENDING','APPROVED','REJECTED')   NOT NULL DEFAULT 'PENDING',
  `rejectionReason` VARCHAR(191)                            NULL,
  `submittedById`   VARCHAR(191)                            NOT NULL,
  `reviewedById`    VARCHAR(191)                            NULL,
  `reviewedAt`      DATETIME(3)                             NULL,
  `createdAt`       DATETIME(3)                             NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)                             NOT NULL,

  INDEX `community_listings_type_status_idx`(`type`, `status`),
  INDEX `community_listings_ward_idx`(`ward`),
  INDEX `community_listings_submittedById_idx`(`submittedById`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `community_listings` ADD CONSTRAINT `community_listings_submittedById_fkey`
  FOREIGN KEY (`submittedById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
