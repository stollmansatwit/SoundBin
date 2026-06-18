/*
  Warnings:

  - The primary key for the `albums` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `artistId` on the `albums` table. All the data in the column will be lost.
  - You are about to drop the column `coverUrl` on the `albums` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `albums` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `albums` table. All the data in the column will be lost.
  - You are about to drop the column `releaseDate` on the `albums` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `albums` table. All the data in the column will be lost.
  - The primary key for the `artists` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `biography` on the `artists` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `artists` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `artists` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `artists` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `artists` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `play_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `playlist_tracks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `playlists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tracks` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - The required column `album_id` was added to the `albums` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `artist_id` to the `albums` table without a default value. This is not possible if the table is not empty.
  - The required column `artist_id` was added to the `artists` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `bio` to the `artists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `display_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_active` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_admin` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `register_date` to the `users` table without a default value. This is not possible if the table is not empty.
  - The required column `user_id` was added to the `users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "albums" DROP CONSTRAINT "albums_artistId_fkey";

-- DropForeignKey
ALTER TABLE "play_events" DROP CONSTRAINT "play_events_trackId_fkey";

-- DropForeignKey
ALTER TABLE "play_events" DROP CONSTRAINT "play_events_userId_fkey";

-- DropForeignKey
ALTER TABLE "playlist_tracks" DROP CONSTRAINT "playlist_tracks_playlistId_fkey";

-- DropForeignKey
ALTER TABLE "playlist_tracks" DROP CONSTRAINT "playlist_tracks_trackId_fkey";

-- DropForeignKey
ALTER TABLE "playlists" DROP CONSTRAINT "playlists_userId_fkey";

-- DropForeignKey
ALTER TABLE "tracks" DROP CONSTRAINT "tracks_albumId_fkey";

-- DropForeignKey
ALTER TABLE "tracks" DROP CONSTRAINT "tracks_artistId_fkey";

-- DropIndex
DROP INDEX "albums_artistId_idx";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "albums" DROP CONSTRAINT "albums_pkey",
DROP COLUMN "artistId",
DROP COLUMN "coverUrl",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "releaseDate",
DROP COLUMN "updatedAt",
ADD COLUMN     "album_id" TEXT NOT NULL,
ADD COLUMN     "artist_id" INTEGER NOT NULL,
ADD COLUMN     "cover_art_url" TEXT,
ADD COLUMN     "release_date" TIMESTAMP(3),
ADD CONSTRAINT "albums_pkey" PRIMARY KEY ("album_id");

-- AlterTable
ALTER TABLE "artists" DROP CONSTRAINT "artists_pkey",
DROP COLUMN "biography",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "imageUrl",
DROP COLUMN "updatedAt",
ADD COLUMN     "artist_id" TEXT NOT NULL,
ADD COLUMN     "bio" TEXT NOT NULL,
ADD COLUMN     "image_url" TEXT,
ADD CONSTRAINT "artists_pkey" PRIMARY KEY ("artist_id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "id",
DROP COLUMN "updatedAt",
ADD COLUMN     "display_name" TEXT NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL,
ADD COLUMN     "is_admin" BOOLEAN NOT NULL,
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "register_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");

-- DropTable
DROP TABLE "play_events";

-- DropTable
DROP TABLE "playlist_tracks";

-- DropTable
DROP TABLE "playlists";

-- DropTable
DROP TABLE "tracks";

-- CreateTable
CREATE TABLE "user_favorites" (
    "favorite_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "date_added" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("favorite_id")
);

-- CreateTable
CREATE TABLE "user_activity" (
    "activity_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "track_id" INTEGER,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_played" INTEGER,

    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("activity_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
