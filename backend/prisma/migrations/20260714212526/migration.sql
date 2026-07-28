-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "register_date" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "last_login" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_favorites" (
    "favorite_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "date_added" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("favorite_id")
);

-- CreateTable
CREATE TABLE "user_activity" (
    "activity_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "track_id" INTEGER,
    "played_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_played" INTEGER,

    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "track_id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "album_id" INTEGER,
    "release_date" DATE,
    "duration" INTEGER NOT NULL,
    "cover_art_url" VARCHAR(500),

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("track_id")
);

-- CreateTable
CREATE TABLE "artists" (
    "artist_id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "bio" TEXT,
    "image_url" VARCHAR(500),

    CONSTRAINT "artists_pkey" PRIMARY KEY ("artist_id")
);

-- CreateTable
CREATE TABLE "albums" (
    "album_id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "artist_id" INTEGER,
    "release_date" DATE,
    "cover_art_url" VARCHAR(500),

    CONSTRAINT "albums_pkey" PRIMARY KEY ("album_id")
);

-- CreateTable
CREATE TABLE "track_contributors" (
    "contribution_id" SERIAL NOT NULL,
    "track_id" INTEGER NOT NULL,
    "artist_id" INTEGER NOT NULL,
    "role" VARCHAR(100),

    CONSTRAINT "track_contributors_pkey" PRIMARY KEY ("contribution_id")
);

-- CreateTable
CREATE TABLE "user_tags" (
    "tag_id" SERIAL NOT NULL,
    "track_id" INTEGER NOT NULL,
    "tag_name" VARCHAR(50) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "user_tags_pkey" PRIMARY KEY ("tag_id")
);

-- CreateTable
CREATE TABLE "album_track_sequence" (
    "album_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "sequence_number" INTEGER NOT NULL,

    CONSTRAINT "album_track_sequence_pkey" PRIMARY KEY ("album_id","track_id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "playlist_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "source_type" VARCHAR(100) NOT NULL DEFAULT 'manual',
    "date_created" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("playlist_id")
);

-- CreateTable
CREATE TABLE "playlist_items" (
    "playlist_item_id" SERIAL NOT NULL,
    "playlist_id" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,
    "sequence_number" INTEGER NOT NULL,

    CONSTRAINT "playlist_items_pkey" PRIMARY KEY ("playlist_item_id")
);

-- CreateTable
CREATE TABLE "genres" (
    "genre_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("genre_id")
);

-- CreateTable
CREATE TABLE "track_genre" (
    "track_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    CONSTRAINT "track_genre_pkey" PRIMARY KEY ("track_id","genre_id")
);

-- CreateTable
CREATE TABLE "track_files" (
    "file_id" SERIAL NOT NULL,
    "track_id" INTEGER NOT NULL,
    "storage_path_url" VARCHAR(500) NOT NULL,
    "bitrate" SMALLINT NOT NULL,
    "sample_rate" INTEGER NOT NULL,
    "channels" SMALLINT NOT NULL,
    "codec" VARCHAR(20) NOT NULL,
    "file_mtime" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "track_files_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "lyrics_connection" (
    "track_id" INTEGER NOT NULL,
    "language" VARCHAR(10) NOT NULL,
    "lyric_test" TEXT,

    CONSTRAINT "lyrics_connection_pkey" PRIMARY KEY ("track_id","language")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorites_user_id_track_id_key" ON "user_favorites"("user_id", "track_id");

-- CreateIndex
CREATE INDEX "user_activity_user_id_played_at_idx" ON "user_activity"("user_id", "played_at");

-- CreateIndex
CREATE INDEX "user_activity_track_id_idx" ON "user_activity"("track_id");

-- CreateIndex
CREATE INDEX "tracks_album_id_idx" ON "tracks"("album_id");

-- CreateIndex
CREATE INDEX "albums_artist_id_idx" ON "albums"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "track_contributors_track_id_artist_id_role_key" ON "track_contributors"("track_id", "artist_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "user_tags_user_id_track_id_tag_name_key" ON "user_tags"("user_id", "track_id", "tag_name");

-- CreateIndex
CREATE UNIQUE INDEX "album_track_sequence_album_id_sequence_number_key" ON "album_track_sequence"("album_id", "sequence_number");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_items_playlist_id_sequence_number_key" ON "playlist_items"("playlist_id", "sequence_number");

-- CreateIndex
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");

-- CreateIndex
CREATE UNIQUE INDEX "track_files_storage_path_url_key" ON "track_files"("storage_path_url");

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("track_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("track_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("album_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("artist_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_contributors" ADD CONSTRAINT "track_contributors_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("track_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_contributors" ADD CONSTRAINT "track_contributors_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("artist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("track_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_track_sequence" ADD CONSTRAINT "album_track_sequence_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("album_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_track_sequence" ADD CONSTRAINT "album_track_sequence_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("track_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("playlist_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("track_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_genre" ADD CONSTRAINT "track_genre_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("track_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_genre" ADD CONSTRAINT "track_genre_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("genre_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_files" ADD CONSTRAINT "track_files_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("track_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lyrics_connection" ADD CONSTRAINT "lyrics_connection_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("track_id") ON DELETE CASCADE ON UPDATE CASCADE;
