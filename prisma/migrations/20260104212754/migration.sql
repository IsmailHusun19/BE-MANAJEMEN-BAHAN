/*
  Warnings:

  - You are about to drop the column `status` on the `line` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `mesin` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `produk` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `line` DROP COLUMN `status`;

-- AlterTable
ALTER TABLE `mesin` DROP COLUMN `status`;

-- AlterTable
ALTER TABLE `produk` DROP COLUMN `status`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `status`;
