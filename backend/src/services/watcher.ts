/**
 * @file Finds files and uploads them to prisma database
 * @module FileWatcher
 * @author Ian MacDougall
 * @version 0.2
 */
import chokidar from 'chokidar';
import { extractMetadata } from '../utils/metadata'; 
import {prisma} from "../lib/database"

const uploadPath = String(process.env.DOCKER_SONG_FILE_LOCATION);

// Initialize watcher
const watcher = chokidar.watch(uploadPath, {
  persistent: true,
}) as any;

console.log(`Watching for new files in: ${uploadPath}`);

watcher.on('add', (filePath: string) => {
  console.log(`New file detected: ${filePath}`);
  

  // Filter for music files only
if (filePath.endsWith('.mp3') || filePath.endsWith('.wav') || filePath.endsWith('.flac')) {
    extractMetadata(filePath).then(async (metadata) => {
      /** 
       * Steps
       * 1. get genreID
       * 2. get albumID & artistID
       * 3. create track
       * 4. create track file
       */
      try { 
        // 1. Resovle Genre
        let genreID = null;
        if (metadata.genre) {
          const existingGenre = await prisma.genre.findUnique({ where: { name: metadata.genre } });
          if (existingGenre) {
            genreID = existingGenre.genre_id;
          } else {
            const newGenre = await prisma.genre.create({
              data: {
                name: metadata.genre
              }});
            genreID = newGenre.genre_id;
          }
        }

        // 2. Resolve Album & Artist
        let albumID = null;
        let artistID = null;
        if (metadata.album && metadata.album !== "Unknown") {
          const existingAlbum = await prisma.album.findUnique({ where: { title: metadata.album } });
          if (existingAlbum) {
            albumID = existingAlbum.album_id
            artistID = existingAlbum.artist_id;
          } else { // no album and not unknown, check for artist, then create album
            const existingArtist = await prisma.artist.findUnique({ where: { name: metadata.artist}})
            if (existingArtist) {
              artistID = existingArtist.artist_id;
              const newAlbum = await prisma.album.create({
                data: {
                  title: metadata.album, 
                  artist_id: artistID,
                  // update for BIO, RELEASE DATE & PHOTO URL
                }}); 
              albumID = newAlbum.album_id;
            } else { // artist doesn't exist, create artist then create album
              const newArtist = await prisma.artist.create({
                data: {
                  name: metadata.artist,
                  // update for BIO & PHOTO URL
                }});
              artistID = newArtist.artist_id;
              const newAlbum = await prisma.album.create({
                data: {
                  title: metadata.album, 
                  artist_id: artistID,
                  // update for BIO, RELEASE DATE & PHOTO URL
                }}); 
              albumID = newAlbum.album_id;
            }

          }
        }
      
        // 3. Create track
        const track = await prisma.track.create({
          data: {
            title: metadata.title,
            album_id: albumID,
            release_year: metadata.date,
            duration: metadata.duration,
            // update for COVER ART URL

            track_genre: {create: genreID ? {genre_id: genreID}: undefined}
          }
        });

        // 4. Create Track File
        await prisma.trackFile.create({
          data: {
            track_id: track.track_id,
            storage_path_url: filePath,
            bitrate: metadata.bitrate, // metadata needs update
            //sample_rate: 0 || metadata.sample_rate, // metadata needs update
            //channels: 2 || metadata.channels, // metadata needs update
            codec: metadata.codec,
            file_mtime: new Date()
            //file_hash String  @db.VarChar(64)
          }
        });
        console.log("Successfully indexed: ${track.Title}");
      } catch (err) {
        console.error("Error saving to database:", err);
      }
    });
  }
});