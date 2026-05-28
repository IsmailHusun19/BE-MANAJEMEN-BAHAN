/*
  Warnings:

  - A unique constraint covering the columns `[nik]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `nik` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Users_nik_key` ON `Users`(`nik`);
