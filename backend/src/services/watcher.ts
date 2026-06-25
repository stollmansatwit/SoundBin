/**
 * @file desc
 * @module FileWatcher
 * @author Ian MacDougall
 * @version 0.1
 */
import chokidar from 'chokidar';
import path from 'path';
import { extractMetadata } from '../utils/metadata'; 

const uploadPath = process.env.UPLOAD_DIR || './uploads';

// Initialize watcher
const watcher = chokidar.watch(uploadPath, {
  persistent: true,
  ignoreInitial: false // This processes existing files on startup
});

console.log(`Watching for new files in: ${uploadPath}`);

watcher.on('add', (filePath) => {
  console.log(`New file detected: ${filePath}`);
  
  // Filter for music files only
  if (filePath.endsWith('.mp3') || filePath.endsWith('.wav')) {
    extractMetadata(filePath).then(data => {
      console.log("Successfully extracted metadata and saved to DB");
      // Here you would call your Prisma logic: 
      // prisma.tracks.create({ data: ... })
    });
  }
});