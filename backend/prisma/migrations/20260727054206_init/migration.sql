/*
  Warnings:

  - A unique constraint covering the columns `[file_hash]` on the table `track_files` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "track_files" ADD COLUMN     "file_hash" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "track_files_file_hash_key" ON "track_files"("file_hash");
