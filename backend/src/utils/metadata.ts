/**
 * @file Pulls relavent metadata from the song file, used by watcher.ts
 * @module MetadataReader
 * @author Ian MacDougall
 * @version 0.1
 */

import * as mm from 'music-metadata';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

  const BaseDir = process.env.DOCKER_SONG_FILE_LOCATION;
  const targetDir = `${BaseDir}/assets`;


async function saveCoverArt(picture: any): Promise<string | null> {
  if(!picture?.data) return null;
  const ext = picture.format?.split('/')[1]?.replace('jpeg','jpg') ?? 'jpg';
  const hash = createHash('sha256').update(picture.data).digest('hex').slice(0, 16);
  const fileName = `${hash}.${ext}`;
  const outPath = path.join(targetDir, fileName);

  // checking if already saved
  try {
    await fs.access(outPath);
  } catch {
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(outPath, picture.data);
  }
  return outPath;
}


/**
 * Parses a music file and returns an object containing 
 * information we can save to our database via Prisma.
 */
export async function extractMetadata(filePath: string) {
  const absolutePath = path.resolve(filePath)
  try {
    // mm.parseFile reads the file and extracts ID3/metadata tags
    const metadata = await mm.parseFile(absolutePath);
    /*Metadata that should be found
    # Descriptive
    title
    artist
    album
    album artist
    track number
    total track number
    disc number
    year/data
    gener

    composer
    conductor
    performers
    remixer
    label/publisher

    # Possible 
    lyrics
    embedded cover art
    BPM
    key
    mood
    comments

    # Technical
    Duration
    bitrate
    sample rate
    channels
    bit depth
    codec
    container format
    Constant Bitrate or Variable Bitrate
    */

    const common = metadata.common as any
    const format = metadata.format as any

    const pic = common.picture?.[0];
    const file_path = await saveCoverArt(pic);

    // console.log('picture raw:', common.picture);
    // console.log('picture count:', common.picture?.length ?? 0);

    const info = {
      title: common?.title || "Unknown Title",
      artist: common?.artist || "Unknown Artist",
      album: common?.album || "Unknown Album",
      genre: common?.genre ?? null,
      track: common?.track?.no ?? null,
      date: common?.date ?? null, 
      cover_url: file_path ?? null,
      // data
      duration: typeof format.duration == 'number' ? Math.floor(format.duration) : 0, // in seconds
      codec: format?.codec || "Unknown Codec",
      bitrate: format?.bitrate ? Math.round(format.bitrate / 1000) : 0, // for KBps
      sample_rate: typeof format?.sampleRate === 'number' ? format.sampleRate : 0,
      channels: typeof format?.numberOfChannels === 'number' ? format.numberOfChannels : 0
    };

    // console.log("Extracted Data:", info);
    return {
      title: info.title,
      artist: info.artist,
      album: info.album,
      duration: info.duration,
      genre: info.genre,
      track: info.track,
      cover_url: info.cover_url,
      date: info.date,
      codec: info.codec,
      bitrate: info.bitrate,
      sample_rate: info.sample_rate,
      channels: info.channels
      // returned to the watcher can use it to create a Prisma record
    };
  } catch (error) {
    console.error(`Error parsing metadata for ${filePath}:`, error);
    throw error;
  }
}
