/**
 * @file Finds files and uploads them to prisma database using Chokidar
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
  ignoreInitial: true
}) as any;

console.log(`Watching for new files in: ${uploadPath}`);

watcher.on('add', (filePath: string) => {
  console.log(`New file detected: ${filePath}`);
  
  if (filePath.endsWith('.mp3') || filePath.endsWith('.wav') || filePath.endsWith('.flac')) {
    extractMetadata(filePath).then(async (metadata) => {
      const doesExist = await prisma.trackFile.findUnique({
        where: {storage_path_url: filePath}
      });
      if (doesExist){
        return;
      }
      /** 
       * Steps
       * 1. get genreID
       * 2. get albumID & artistID
       * 3. create track
       * 4. Create album track sequence
       * 5. Handles Track Contributors ? 
       * 6. create track file
       */
      try { 
        // 1. Resovle Genre
        let genreID = null;
        if (metadata.genre) { // Checking if metadata exists
          const rawGenreName = Array.isArray(metadata.genre) ? metadata.genre[0] : metadata.genre; // Should be updated for multiple genres
          const genreName = rawGenreName ? String(rawGenreName).trim() : null;
          if (genreName){
            const existingGenre = await prisma.genre.findFirst({ 
              where: { 
                name: {
                  equals: metadata.genre[0],
                  mode: 'insensitive'
                }
              }
              });
            if (existingGenre) {
              genreID = existingGenre.genre_id;
            } else {
              const newGenre = await prisma.genre.create({
                data: {
                  name: genreName
                }});
              genreID = newGenre.genre_id;
            }
          }// GenreName metadata did not exist
          
        }

        // 2. Resolve Album & Artist
        let albumID = null;
        let artistID = null;
        if (metadata.artist && metadata.artist !== "Unknown Artist") {
          // if metadata for artist exists, check if artist already exists
          const existingArtist = await prisma.artist.findFirst({
            where:{
              name: {
                equals: metadata.artist,
                mode: 'insensitive'
              }
            }
          });

          if (existingArtist){ // Artist exists, check for album under artist where = title
            artistID = existingArtist.artist_id;
          } else { // Arist does not exist
            const newArtist = await prisma.artist.create({
              data:{
                name: metadata.artist,
                // Update for BIO & IMAGE_URL
              }
            });
            artistID = newArtist.artist_id;
          }

          if (metadata.album && metadata.album !== "Unknown Album"){
            // if metdata for artist & album exists, check if album already exists
            const existingAlbum = await prisma.album.findFirst({
              where:{
                title:{
                  equals: metadata.album,
                  mode: `insensitive`
                },
                artist_id: artistID
              }
            });

            if (existingAlbum) { // Album exists, get Album ID
              albumID = existingAlbum.album_id;
            } else { // Album doesn't exisit 
              const newAlbum = await prisma.album.create({
                data:{
                  title: metadata.album,
                  artist_id: artistID,
                  release_date: metadata.date ? new Date('${metadata.date}-01-01') : null,
                  // Update for COVER_ART_URL later
                }
              });
              albumID = newAlbum.album_id;
            }
          } else { // Album metadata doesn't exist, should add elif for Unknown Album
            // upload to unknown
            console.log("UNKOWN ALBUM UPLOAD FROM FILE");
          }
        } else { // Artist metadata doesn't exist, should add elif for Unknown Artists
          // upload to uknown
          console.log("UNKOWN ARTIST UPLOAD FROM FILE");
        }

      
        // 3. Create track
        // should check if track already exists
        const track = await prisma.track.create({
          data: {
            title: metadata.title,
            release_date: metadata.date ? new Date('${metadata.date}-01-01') : null,
            duration: metadata.duration,
            // update for COVER ART URL
            album: albumID ? {connect:{album_id: albumID}} : undefined,
            genres: genreID ? {create: {genre_id: genreID}} : undefined
          }
        });

        // 4. Create Album Track Sequence
        const trackNum = metadata.track ? metadata.track.no : null;
        if(albumID && trackNum) {
          await prisma.albumTrackSequence.create({ 
            data: {
            album_id: albumID,
            track_id: track.track_id,
            sequence_number: trackNum
            } 
          });
        }

        // 5. Handle Track Contributors ?

        // 6. Create Track File
        await prisma.trackFile.create({
          data: {
            track_id: track.track_id,
            storage_path_url: filePath,
            bitrate: metadata.bitrate, // KBps
            sample_rate: metadata.sample_rate,
            channels: metadata.channels, 
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