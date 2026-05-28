/*
  Warnings:

  - You are about to drop the column `nomorMensin` on the `mesin` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nomorMesin]` on the table `Mesin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nomorMesin` to the `Mesin` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Mesin_nomorMensin_key` ON `mesin`;

-- AlterTable
ALTER TABLE `mesin` DROP COLUMN `nomorMensin`,
    ADD COLUMN `nomorMesin` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Mesin_nomorMesin_key` ON `Mesin`(`nomorMesin`);
