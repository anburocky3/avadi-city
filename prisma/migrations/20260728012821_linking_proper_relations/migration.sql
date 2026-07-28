/*
  Warnings:

  - You are about to drop the column `authorId` on the `comments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `comments` DROP FOREIGN KEY `comments_authorId_fkey`;

-- DropIndex
DROP INDEX `comments_authorId_idx` ON `comments`;

-- AlterTable
ALTER TABLE `comments` DROP COLUMN `authorId`,
    ADD COLUMN `author_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `comments_author_id_idx` ON `comments`(`author_id`);

-- CreateIndex
CREATE INDEX `feed_likes_feed_id_idx` ON `feed_likes`(`feed_id`);

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `feeds` RENAME INDEX `feeds_authorId_fkey` TO `feeds_authorId_idx`;
