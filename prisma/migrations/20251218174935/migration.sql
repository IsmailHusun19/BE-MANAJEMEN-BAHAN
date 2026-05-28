/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Produk` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Produk_name_key` ON `Produk`(`name`);
