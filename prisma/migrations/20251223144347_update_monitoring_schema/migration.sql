/*
  Warnings:

  - A unique constraint covering the columns `[nomorMensin]` on the table `Mesin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nomorMensin` to the `Mesin` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Mesin_name_key` ON `mesin`;

-- AlterTable
ALTER TABLE `mesin` ADD COLUMN `nomorMensin` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Mesin_nomorMensin_key` ON `Mesin`(`nomorMensin`);
