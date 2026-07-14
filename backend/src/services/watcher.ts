/**
 * @file Finds files and uploads them to prisma database using Chokidar
 * @module FileWatcher
 * @author Ian MacDougall
 * @version 0.2
 */
import chokidar from 'chokidar';
import { extractMetadata } from '../utils/metadata'; 
import {prisma} from "../lib/database"
import { isDate } from 'util/types';

const BaseDir = process.env.DOCKER_SONG_FILE_LOCATION;
const targetDir = `${BaseDir}/songs`;
const uploadPath = String(targetDir);

// Initialize watcher
const watcher = chokidar.watch(uploadPath, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000, // wait 2 seconds to finish
    pollInterval: 100,  // check every .1 seconds
  },
}) as any;


// Helper functions
function UnknownArtistAndAlbum(){

}

function getDate(dateString: string | undefined): Date | null {
  if (!dateString) {
    return null;
  }
  const date = new Date(dateString);
  // if isNaN(date.getTime()) is true, it means the date is not a valid date, so we return null
  return isDate(date.getTime()) ? date : null;
}


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
        //2.1. if metadata for artist exists, check if artist already exists
        if (metadata.artist && metadata.artist !== "Unknown Artist") {
          const existingArtist = await prisma.artist.findFirst({
            where:{
              name: {
                equals: metadata.artist,
                mode: 'insensitive'
              }
            }
          });
          // 2.2. If Artist exists, check for album under artist where = title
          if (existingArtist){ artistID = existingArtist.artist_id;
          } else { // Arist does not exist
            const newArtist = await prisma.artist.create({
              data:{
                name: metadata.artist,
                // Update for BIO & IMAGE_URL
              }
            });
            artistID = newArtist.artist_id;
          }
          // 2.3. if metdata for artist & album exists, check if album already exists
          if (metadata.album && metadata.album !== "Unknown Album"){
            const existingAlbum = await prisma.album.findFirst({
              where:{
                title:{
                  equals: metadata.album,
                  mode: `insensitive`
                },
                artist_id: artistID
              }
            });
            // 2.4. If Album exists, get Album ID
            if (existingAlbum) { albumID = existingAlbum.album_id;
            } else { // Album doesn't exist

              
              const newAlbum = await prisma.album.create({
                data:{
                  title: metadata.album,
                  artist_id: artistID,
                  release_date: getDate(metadata.date),
                  cover_art_url: metadata.cover_url,
                }
                
              });
              albumID = newAlbum.album_id;
            }
            // 2.4. If album unknown add to known artist singles playlist
          } else if (metadata.album == "Unknown Album") {
            // upload to unknown

          } else { console.log("ERROR FINDING METADATA OF ALBUM FROM FILE"); } // Album metadata not given, log error
        } else if (metadata.artist == "Unknown Artist") {
          // 2.5. If artisit unknown and album unknown, add to unknown 'album' / 'playlist'
          const existingUnknownArtist = await prisma.artist.findFirst({
            where:{
              name: {
                equals: 'Unknown',
                mode: 'insensitive'
              }
            }
          });
          // 2.6. If Unknown Artist exists, check for album under artist where = title
          if (existingUnknownArtist){ artistID = existingUnknownArtist.artist_id;
          } else { // Arist does not exist
            const newUnknownArtist = await prisma.artist.create({
              data:{
                name: metadata.artist,
                // Update for BIO & IMAGE_URL
              }
            });
            artistID = newUnknownArtist.artist_id;
          }
          // 2.7. If album Unknown, album not in errors
          if (metadata.album == "Unknown Album") {
            const existingUnkownAlbum = await prisma.album.findFirst({
              where:{
                title:{
                  equals: `Unknown`,
                  mode: `insensitive`
                },
              }
            });
            // 2.8. If album exists add to singles "album"
            if (existingUnkownAlbum) {albumID = existingUnkownAlbum.album_id;
            } else {
              const newUnknownAlbum = await prisma.album.create({
                data:{
                  title: 'Unknown',
                  artist_id: artistID,
                  release_date: getDate(metadata.date),
                  cover_art_url: null,
                }
              });
              albumID = newUnknownAlbum.album_id;
            }
          } else { console.log("ERROR FINDING METADATA OF ALBUM FROM FILE"); } // Album metadata not given, log error
        } else{ console.log("ERROR FINDING METADATA OF ARTIST FROM FILE"); } // Artist metadata not given, log error

      
        // 3. Create track
        // should check if track already exists
        const track = await prisma.track.create({
          data: {
            title: metadata.title,
            release_date: getDate(metadata.date),
            duration: metadata.duration,
            cover_art_url: metadata.cover_url,
            album: albumID ? {connect:{album_id: albumID}} : undefined,
            genres: genreID ? {create: {genre_id: genreID}} : undefined
          }
        });

        // 4. Create Album Track Sequence
        const trackNum = metadata.track ? metadata.track : null;
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
        console.log(`Successfully indexed: ${track.title}`);
      } catch (err) {
        console.error("Error saving to database:", err);
      }
    }).catch((err) => console.error(`INGEST FAILED for ${filePath}:`, err));
  }
});


