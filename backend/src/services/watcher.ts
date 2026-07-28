/**
 * @file Watches the songs directory with chokidar and indexes any audio
 * file it finds via the shared ingest service. Handles files that arrive
 * by any means other than the /api/upload route (e.g. a synced or
 * manually-copied folder).
 * @module FileWatcher
 * @author Ian MacDougall
 * @version 0.4
 */
import chokidar from 'chokidar';
import { ingestTrackFile } from './ingest';
import path from 'path';

const BaseDir = process.env.DOCKER_SONG_FILE_LOCATION;
const BaseDirString = String(BaseDir);
console.log(`BaseDir: ${BaseDirString}`);
const targetDir = path.join(BaseDirString, 'songs');

const usePolling = process.env.CHOKIDAR_USEPOLLING === 'true' || process.env.NODE_ENV === 'docker';

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac'];

function isAudioFile(filePath: string): boolean {
  return AUDIO_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

// Initialize watcher.
//
// ignoreInitial is intentionally NOT set to true: with it true, any file
// already sitting in the songs directory when the service starts (e.g.
// because it was copied in, or an upload happened while the backend was
// down) would never be indexed until something else touched it. Since
// ingestTrackFile() is idempotent (it checks storage_path_url and
// file_hash before doing any real work), re-scanning already-indexed
// files on every startup is cheap and safe.
const watcher = chokidar.watch(targetDir, {
  persistent: true,
  usePolling,
  binaryInterval: 300,
  awaitWriteFinish: {
    stabilityThreshold: 2000, // wait 2 seconds to finish
    pollInterval: 100, // check every .1 seconds
  },
}) as any;

console.log(`Watching for new and existing files in: ${targetDir}`);

watcher.on('add', (filePath: string) => {
  if (!isAudioFile(filePath)) return;

  console.log(`File detected: ${filePath}`);
  ingestTrackFile(filePath)
    .then((result) => {
      if (result.status === 'created') {
        console.log(`Successfully indexed: ${result.title}`);
      } else if (result.status === 'duplicate') {
        console.log(`Duplicate content skipped (matches existing track "${result.title}"): ${filePath}`);
      } else if (result.status === 'exists') {
        // Already indexed (most commonly: the upload route ingested it
        // synchronously before the watcher's own event fired).
      } else {
        console.error(`Ingest failed for ${filePath}: ${result.message}`);
      }
    })
    .catch((err) => console.error(`Unexpected error ingesting ${filePath}:`, err));
});

watcher.on('error', (err: unknown) => console.error('Watcher error:', err));
