/**
 * @file Fetches artist images and album cover art from public, key-free
 * music metadata APIs when a file's own embedded tags don't include
 * artwork. Deezer is tried first (keyless, generous rate limit, has both
 * artist photos and album covers); MusicBrainz + the Cover Art Archive is
 * a fallback for album art Deezer doesn't have.
 *
 * Everything here is best-effort: any failure returns null rather than
 * throwing, since a missing picture should never break ingestion of the
 * actual audio file.
 * @module Artwork
 */
import path from 'path';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';

const BaseDir = process.env.DOCKER_SONG_FILE_LOCATION;
const ASSETS_DIR = `${BaseDir}/assets`;

// MusicBrainz requires a descriptive User-Agent identifying the app and a
// contact so they can reach out if something misbehaves — replace the
// contact with your own project URL/email. No API key involved, but an
// "anonymous"-looking User-Agent gets throttled much harder.
const MUSICBRAINZ_USER_AGENT = 'SoundBin/0.1 (contact: replace-with-your-contact@example.com)';

// MusicBrainz allows ~1 request/second per IP; going faster gets you 503s.
// This tracks the last request time (per Node process) so calls here
// always wait out the remainder of that window first.
let lastMusicBrainzRequestAt = 0;
async function waitForMusicBrainzRateLimit(): Promise<void> {
  const MIN_INTERVAL_MS = 1100; // a bit over 1s for safety margin
  const elapsed = Date.now() - lastMusicBrainzRequestAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastMusicBrainzRequestAt = Date.now();
}

/**
 * Normalizes a name for comparison: case-insensitive, punctuation and
 * accents stripped, whitespace collapsed. Used to verify a search result
 * actually IS the artist/album we searched for, rather than trusting
 * whatever a relevance-ranked search put first — see fetchArtistImage.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (é -> e, etc.)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Downloads image bytes from a URL and saves them into the same
 * content-addressed assets store embedded cover art already uses (hashed
 * filename, so re-fetching the same picture is a no-op), returning the
 * local path to serve via /assets rather than depending on an external
 * CDN staying up.
 */
async function downloadAndCacheImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const buffer = Buffer.from(await response.arrayBuffer());

    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    const fileName = `${hash}.${ext}`;
    const outPath = path.join(ASSETS_DIR, fileName);

    try {
      await fs.access(outPath);
    } catch {
      await fs.mkdir(ASSETS_DIR, { recursive: true });
      await fs.writeFile(outPath, buffer);
    }
    return outPath;
  } catch (err) {
    console.error(`Could not download image from ${url}:`, err);
    return null;
  }
}

/**
 * Looks up an artist's photo via Deezer's public (key-free) search API.
 */
export async function fetchArtistImage(artistName: string): Promise<string | null> {
  try {
    const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}&limit=5`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data: any = await response.json();
    const candidates: any[] = Array.isArray(data?.data) ? data.data : [];

    // Deliberately not "just take the first result": Deezer's relevance
    // ranking can put an unrelated same-ish-named act above the real one,
    // especially for short/generic names (e.g. "U2"). A wrong picture is
    // worse than no picture, so only a result whose name matches exactly
    // (after normalizing case/punctuation) is used — no best-guess fallback.
    const target = normalizeName(artistName);
    const match = candidates.find((c) => normalizeName(c?.name ?? '') === target);
    if (!match) return null;

    const imageUrl: string | undefined = match.picture_xl || match.picture_big || match.picture_medium;
    if (!imageUrl) return null;

    return await downloadAndCacheImage(imageUrl);
  } catch (err) {
    console.error(`Deezer artist image lookup failed for "${artistName}":`, err);
    return null;
  }
}

/**
 * Looks up album cover art: Deezer first, then MusicBrainz + the Cover
 * Art Archive for anything Deezer's catalog doesn't have.
 */
export async function fetchAlbumArt(artistName: string, albumTitle: string): Promise<string | null> {
  const fromDeezer = await fetchAlbumArtFromDeezer(artistName, albumTitle);
  if (fromDeezer) return fromDeezer;
  return fetchAlbumArtFromMusicBrainz(artistName, albumTitle);
}

async function fetchAlbumArtFromDeezer(artistName: string, albumTitle: string): Promise<string | null> {
  try {
    const query = `artist:"${artistName}" album:"${albumTitle}"`;
    const url = `https://api.deezer.com/search/album?q=${encodeURIComponent(query)}&limit=5`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data: any = await response.json();
    const candidates: any[] = Array.isArray(data?.data) ? data.data : [];

    const targetAlbum = normalizeName(albumTitle);
    const targetArtist = normalizeName(artistName);
    const match = candidates.find(
      (c) => normalizeName(c?.title ?? '') === targetAlbum && normalizeName(c?.artist?.name ?? '') === targetArtist,
    );
    if (!match) return null;

    const imageUrl: string | undefined = match.cover_xl || match.cover_big || match.cover_medium;
    if (!imageUrl) return null;

    return await downloadAndCacheImage(imageUrl);
  } catch (err) {
    console.error(`Deezer album art lookup failed for "${artistName} - ${albumTitle}":`, err);
    return null;
  }
}

async function fetchAlbumArtFromMusicBrainz(artistName: string, albumTitle: string): Promise<string | null> {
  try {
    await waitForMusicBrainzRateLimit();

    const query = `artist:"${artistName}" AND release:"${albumTitle}"`;
    const searchUrl = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json&limit=5`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': MUSICBRAINZ_USER_AGENT },
    });
    if (!searchResponse.ok) return null;

    const searchData: any = await searchResponse.json();
    const releases: any[] = Array.isArray(searchData?.releases) ? searchData.releases : [];

    const targetAlbum = normalizeName(albumTitle);
    const targetArtist = normalizeName(artistName);
    const match = releases.find((release) => {
      const releaseTitle = normalizeName(release?.title ?? '');
      const creditNames: string[] = Array.isArray(release?.['artist-credit'])
        ? release['artist-credit'].map((credit: any) => normalizeName(credit?.artist?.name ?? credit?.name ?? ''))
        : [];
      return releaseTitle === targetAlbum && creditNames.includes(targetArtist);
    });
    const mbid: string | undefined = match?.id;
    if (!mbid) return null;

    // Cover Art Archive is keyed by MusicBrainz release MBID and is itself
    // key-free. A 404 here just means no art was ever archived for this
    // specific release — common, and not an error.
    const coverArtUrl = `https://coverartarchive.org/release/${mbid}/front-500`;
    return await downloadAndCacheImage(coverArtUrl);
  } catch (err) {
    console.error(`MusicBrainz album art lookup failed for "${artistName} - ${albumTitle}":`, err);
    return null;
  }
}