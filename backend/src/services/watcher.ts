/**
 * @file Finds files and uploads them to prisma database
 * @module FileWatcher
 * @author Ian MacDougall
 * @version 0.1
 */
import chokidar from 'chokidar';
import { extractMetadata } from '../utils/metadata'; 
import {prisma} from "../index"

const uploadPath = process.env.DOCKER_SONG_FILE_LOCATION;

// Initialize watcher
const watcher = chokidar.watch(uploadPath, {
  persistent: true,
  ignoreInitial: false // This processes existing files on startup
}) as any;

console.log(`Watching for new files in: ${uploadPath}`);

watcher.on('add', (filePath: string) => {
  console.log(`New file detected: ${filePath}`);
  
  // Filter for music files only
  if (filePath.endsWith('.mp3') || filePath.endsWith('.wav') || filePath.endsWith('.flac')) {
    extractMetadata(filePath).then(async (data) => {
      try {
        const newTrack = await prisma.track.create({
          data: {
            title: data.title,
            artist: data.artist,
            album: data.album,
            duration: data.duration,
            genre: data.genre,
            track: data.track,
            date: data.date
          }
        });
        console.log(`Successfully added to DB: ${newTrack.id}`);
      } catch (err) {
        console.error("Error saving to database:", err);
      }
    });
  }
});