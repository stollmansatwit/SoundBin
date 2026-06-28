-- AlterTable
ALTER TABLE "users" ALTER COLUMN "is_active" SET DEFAULT true,
ALTER COLUMN "register_date" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "tracks" (
    "track_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist_id" INTEGER NOT NULL,
    "album_id" INTEGER,
    "duration" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "genre" TEXT,
    "release_date" TIMESTAMP(3),
    "lyrics" TEXT,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("track_id")
);
