/*
  Warnings:

  - Made the column `nik` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `nik` VARCHAR(191) NOT NULL;
