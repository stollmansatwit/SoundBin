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

/**
 * Streams the file and returns a sha256 hash of its contents.
 * Used to detect byte-identical duplicate uploads regardless of
 * what filename or path they were saved under, and as a stable
 * content fingerprint independent of the on-disk filename.
 */
export async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}


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
 * Some files tag a full "Primary ft. Featured" credit as a single string in
 * one performer/artist field, rather than using separate multi-artist tags.
 * Taking that whole string literally as "the artist" means every distinct
 * featuring credit for the same primary artist (e.g. "X ft. A", "X ft. B")
 * becomes its own separate Artist — and, since album lookup is scoped by
 * artist, can fragment a single album into several duplicate Album rows too.
 * This pulls the primary artist out so it stays consistent across a whole
 * album regardless of who's featured on which track.
 */
function splitFeaturedArtists(rawArtist: string): { primary: string; featured: string[] } {
  if (!rawArtist) return { primary: rawArtist, featured: [] };

  const match = rawArtist.match(/^(.+?)\s*\(?\s*(?:feat\.?|featuring|ft\.?)\s+(.+?)\)?\s*$/i);
  if (!match) {
    return { primary: rawArtist.trim(), featured: [] };
  }

  const primary = match[1].trim();
  const featured = match[2]
    .split(/\s*(?:,|&|\band\b)\s*/i)
    .map((name) => name.trim())
    .filter(Boolean);

  return { primary, featured };
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

    // common.genre / common.artists are already arrays in music-metadata;
    // previously only the first entry of each was ever used downstream.
    const genres: string[] = Array.isArray(common?.genre) ? common.genre.filter(Boolean) : (common?.genre ? [common.genre] : []);

    const rawArtist = common?.artist || "Unknown Artist";
    const { primary: primaryArtist, featured: splitFeatured } = splitFeaturedArtists(rawArtist);

    const taggedArtists: string[] = Array.isArray(common?.artists) ? common.artists.filter(Boolean) : [];
    // Each tagged artist entry might itself be an unsplit "X ft. Y" combined
    // credit (not just common.artist) — split those too so a raw composite
    // string never leaks through as a bogus separate contributor.
    const expandedTaggedArtists = taggedArtists.flatMap((name) => {
      const { primary, featured } = splitFeaturedArtists(name);
      return [primary, ...featured];
    });

    const artists: string[] = Array.from(
      new Set([primaryArtist, ...expandedTaggedArtists, ...splitFeatured].filter(Boolean)),
    );

    const info = {
      title: common?.title || "Unknown Title",
      artist: primaryArtist || "Unknown Artist",
      artists,
      album: common?.album || "Unknown Album",
      genres,
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
      artists: info.artists,
      album: info.album,
      duration: info.duration,
      genres: info.genres,
      track: info.track,
      cover_url: info.cover_url,
      date: info.date,
      codec: info.codec,
      bitrate: info.bitrate,
      sample_rate: info.sample_rate,
      channels: info.channels
      // returned to the ingest service, used to create Prisma records
    };
  } catch (error) {
    console.error(`Error parsing metadata for ${filePath}:`, error);
    throw error;
  }
}