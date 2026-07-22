/**
 * @file Finds files and uploads them to prisma database using Chokidar
 * @module FileWatcher
 * @author Ian MacDougall
 * @version 0.3
 */
import chokidar from 'chokidar';
import { extractMetadata } from '../utils/metadata';
import { prisma } from "../lib/database"
import { isDate, isNumberObject } from 'util/types';
import path from 'path';

const BaseDir = process.env.DOCKER_SONG_FILE_LOCATION;
const BaseDirString = String(BaseDir);
console.log(`BaseDir: ${BaseDirString}`);
const targetDir = path.join(BaseDirString, 'songs');


const usePolling = process.env.CHOKIDAR_USEPOLLING === 'true' || process.env.NODE_ENV === 'docker';

// Initialize watcher
const watcher = chokidar.watch(targetDir, {
  persistent: true,

  usePolling,
  binaryInterval: 300,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000, // wait 2 seconds to finish
    pollInterval: 100,  // check every .1 seconds
  },
}) as any;


// Helper functions


function getDate(dateString: string | undefined): Date | null {

  /**
   * First check if dateString exists
   * Then turn dateString into a date and check if it is valid and if so return it
   * Then Check if substring(0,10) gives a valid date and if so return it
   * Then check if substring (0,4) gives a valid number and if so, add 01-01 for month and day and return it
   * Then if all else fails, return null
   * 
   */
  if (!dateString) {
    return null;
  }
  const first10 = dateString.substring(0, 10)
  const first4 = Number(dateString.substring(0, 4))
  const date = new Date(dateString);

  if (isDate(date)) {
    return date
  }
  if (isDate(new Date(first10))) {
    return new Date(first10)
  }
  const year = Number(dateString.substring(0, 4));
  if (!Number.isNaN(year)) {
    const yearDate = new Date(`${year}-01-01`);
    if (isDate(yearDate)) {
      return yearDate;
    }
  }
  return null
}

console.log(`Watching for new files in: ${targetDir}`);


/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Prisma Functions
 */


/**
 * Finders
 */
async function findFirstGenre(genreName: string){
  return (
    await prisma.genre.findFirst({
      where: {
        name: {
          equals: genreName,
          mode: 'insensitive'
        }
      }
    })
  );
}

async function findFirstArtist(artistName: string){
  return(
    await prisma.artist.findFirst({
      where: {
        name: {
          equals: artistName,
          mode: 'insensitive'
        }
      }
    })
  );
}

async function findFistAlbum(albumTitle: string, artistID: number){
  return (
    await prisma.album.findFirst({
      where: {
        title: {
          equals: albumTitle,
          mode: `insensitive`
        },
      artist_id: artistID
      }
    })
  );
}

async function findFirstTrack(title: string, duration: number){
  return (
    await prisma.track.findFirst({
        where: {
          title: {
          equals: title,
          mode: 'insensitive'
        },
        duration: duration
      }
    })
  );
}

/**
 * Creators
 */
async function createGenre(genreName: string){
  return (
    await prisma.genre.create({
      data: { name: genreName }
    })
  );
}

async function createArtist(artistName: string){
  return (
    await prisma.artist.create({
      data: {
        name: artistName,
        // Update for BIO & IMAGE_URL
      }
    })
  );
}

async function createAlbum(albumTitle: string, artistID: number, date: any, coverUrl: string | null){
  return(
    await prisma.album.create({
      data: {
        title: albumTitle,
        artist_id: artistID,
        release_date: getDate(date),
        cover_art_url: coverUrl,
      }
    })
  );
}

async function createTrack(trackTitle: string, date: any, duration: number, coverUrl: string | null, albumID: number | null, genreID: number){
  return (
    await prisma.track.create({
      data: {
        title: trackTitle,
        release_date: getDate(date),
        duration: duration,
        cover_art_url: coverUrl,
        album: albumID ? { connect: { album_id: albumID } } : undefined,
        genres: genreID ? { create: { genre_id: genreID } } : undefined,
      }
    })
  );
}

async function createTrackSequence (albumID: number, trackID: number, trackNum: number){
  return (
    await prisma.albumTrackSequence.create({
      data: {
        album_id: albumID,
        track_id: trackID,
        sequence_number: trackNum
      }
    })
  );
}

async function createTrackContributors(trackID: number, artistID: number, role: string ="artist"){
  return (
    await prisma.trackContributor.create({
      data: {
        track_id: trackID,
        artist_id: artistID,
        role: role,
      }
    })
  );
}

async function createTrackFile(trackID: number, filePath: string, bitrate: number, sampleRate: number, channels: number, codec: string){
  return (
    await prisma.trackFile.create({
      data: {
        track_id: trackID,
        storage_path_url: filePath,
        bitrate: bitrate, // KBps
        sample_rate: sampleRate,
        channels: channels,
        codec: codec,
        file_mtime: new Date()
        //file_hash String  @db.VarChar(64)
      }
    })
  );
}



/**
 * What watcher does when new file is found
 */
watcher.on('add', (filePath: string) => {
  console.log(`New file detected: ${filePath}`);

  if (filePath.endsWith('.mp3') || filePath.endsWith('.wav') || filePath.endsWith('.flac')) {
    extractMetadata(filePath).then(async (metadata) => {
      const doesExist = await prisma.trackFile.findUnique({
        where: { storage_path_url: filePath }
      });
      if (doesExist) {
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
        // 1. Resolve Genre
        let genreID = null;

        const rawGenreName = Array.isArray(metadata.genre) ? metadata.genre[0] : metadata.genre;
        const genreName = rawGenreName ? String(rawGenreName).trim() || 'Unknown' : 'Unknown';

        const existingGenre = await findFirstGenre(genreName);

        if (existingGenre) {
          genreID = existingGenre.genre_id;
        } else {
          const newGenre = await createGenre(genreName)
          genreID = newGenre.genre_id;
        }

        // 2. Resolve Album & Artist
        let albumID = null;
        let artistID = null;
        //2.1. if metadata for artist exists, check if artist already exists
        if (metadata.artist && metadata.artist !== "Unknown Artist") {
          const existingArtist = await findFirstArtist(metadata.artist);
          // 2.2. If Artist exists, check for album under artist where = title
          if (existingArtist) {
            artistID = existingArtist.artist_id;
          } else { // Arist does not exist
            const newArtist = await createArtist(metadata.artist);
            artistID = newArtist.artist_id;
          }
          // 2.3. if metdata for artist & album exists, check if album already exists
          if (metadata.album && metadata.album !== "Unknown Album") {
            const existingAlbum = await findFistAlbum(metadata.album, artistID);
            // 2.4. If Album exists, get Album ID
            if (existingAlbum) {
              albumID = existingAlbum.album_id;
            } else { // Album doesn't exist
              const newAlbum = await createAlbum(metadata.album, artistID, metadata.date, metadata.cover_url);
              albumID = newAlbum.album_id;
            }
            // 2.4. If album unknown add to known artist singles playlist
          } else if (metadata.album == "Unknown Album") {
            // upload to unknown
            const existingUnknownAlbum = await findFistAlbum("Unknown Album", artistID);
            // 2.8. If album exists add to singles "album"
            if (existingUnknownAlbum) {
              albumID = existingUnknownAlbum.album_id;
            } else {
              const newUnknownAlbum = await createAlbum("Unknown Album", artistID, metadata.date, null);
              albumID = newUnknownAlbum.album_id;
            }

          } else { console.log("ERROR FINDING METADATA OF ALBUM FROM FILE"); } // Album metadata not given, log error
        } else if (metadata.artist == "Unknown Artist") {
          // 2.5. If artisit unknown and album unknown, add to unknown 'album' / 'playlist'
          const existingUnknownArtist = await findFirstArtist("Unknown Artist");
          // 2.6. If Unknown Artist exists, check for album under artist where = title
          if (existingUnknownArtist) {
            artistID = existingUnknownArtist.artist_id;
          } else { // Arist does not exist
            const newUnknownArtist = await createArtist(metadata.artist);
            artistID = newUnknownArtist.artist_id;
          }
          // 2.7. If album Unknown, album not in errors
          if (metadata.album == "Unknown Album") {
            const existingUnknownAlbum = await findFistAlbum(metadata.album, artistID);
            // 2.8. If album exists add to singles "album"
            if (existingUnknownAlbum) {
              albumID = existingUnknownAlbum.album_id;
            } else {
              const existingUnknownAlbum = await createAlbum("Unknown Album", artistID, metadata.date, null);
              albumID = existingUnknownAlbum.album_id;
            }
          } else { console.log("ERROR FINDING METADATA OF ALBUM FROM FILE"); } // Album metadata not given, log error
        } else { console.log("ERROR FINDING METADATA OF ARTIST FROM FILE"); } // Artist metadata not given, log error


        // 3. Create track
        // should check if track already exists
        const existingTrack = await findFirstTrack(metadata.title, metadata.duration)

        var track;
        if (existingTrack) {
          console.log(`Track already exists: ${existingTrack.title}`);
          track = existingTrack;
        }
        else {
          track = await createTrack(metadata.title, metadata.date, metadata.duration, metadata.cover_url, albumID, genreID);

          // 4. Create Album Track Sequence
          const trackNum = metadata.track ? metadata.track : null;
          if (albumID && trackNum) {
            createTrackSequence (albumID, track.track_id, trackNum);
          }

          // 5. Handle Track Contributors
          if (artistID !== null) createTrackContributors(track.track_id, artistID);

          // 6. Create Track File
          createTrackFile(track.track_id, filePath, metadata.bitrate, metadata.sample_rate, metadata.channels, metadata.codec);
          console.log(`Successfully indexed: ${track.title}`);
        }
      } catch (err) {
        console.error("Error saving to database:", err);
      }
    }).catch((err) => console.error(`INGEST FAILED for ${filePath}:`, err));
  }
});


