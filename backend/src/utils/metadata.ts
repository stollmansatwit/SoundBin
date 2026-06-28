/**
 * @file Pulls relavent metadata from the song file, used by watcher.ts
 * @module MetadataReader
 * @author Ian MacDougall
 * @version 0.1
 */

import * as mm from 'music-metadata';
import { promises as fs } from 'fs';

/**
 * Parses a music file and returns an object containing 
 * information we can save to our database via Prisma.
 */
export async function extractMetadata(filePath: string) {
  try {
    // mm.parseFile reads the file and extracts ID3/metadata tags
    const metadata = await mm.parseFile(filePath);
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
    const info = {
      title: common?.title || "Unknown Title",
      artist: common?.artist || "Unknown Artist",
      album: common?.album || "Unknown Album",
      duration: typeof common.duration == 'number' ? Math.floor(common.duration) : 0, // in seconds
      genre: common?.genre || "Unknown Genre",
      track: common?.track || "Unknown Track",
      date: common?.date || "Unknown Release Date",
    };

    console.log("Extracted Data:", info);
    return {
      title: info.title,
      artist: info.artist,
      album: info.album,
      duration: info.duration,
      genre: info.genre,
      track: info.track,
      date: info.date
      // We return this so the watcher can use it to create a Prisma record
    };
  } catch (error) {
    console.error(`Error parsing metadata for ${filePath}:`, error);
    throw error;
  }
}
