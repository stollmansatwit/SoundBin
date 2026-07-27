/**
 * @file Shared logic for turning a song file on disk into database records.
 * Used by both the upload route (so an upload response reflects real
 * indexing status) and the chokidar watcher (so files dropped in by any
 * other means, e.g. a synced folder, still get picked up).
 * @module Ingest
 */
import { promises as fs } from 'fs';
import { isDate } from 'util/types';
import { extractMetadata, hashFile } from '../utils/metadata';
import { fetchArtistImage, fetchAlbumArt } from './artwork';
import { prisma } from '../lib/database';

export type IngestResult =
  | { status: 'created'; filePath: string; trackId: number; title: string }
  | { status: 'exists'; filePath: string; trackId: number; title: string } // already indexed at this exact path
  | { status: 'duplicate'; filePath: string; trackId: number; title: string } // identical audio content already stored under a different path
  | { status: 'error'; filePath: string; message: string };

// Helpers

function getDate(dateString: string | undefined): Date | null {
  /**
   * First check if dateString exists
   * Then turn dateString into a date and check if it is valid and if so return it
   * Then Check if substring(0,10) gives a valid date and if so return it
   * Then check if substring (0,4) gives a valid number and if so, add 01-01 for month and day and return it
   * Then if all else fails, return null
   */
  if (!dateString) {
    return null;
  }
  const first10 = dateString.substring(0, 10);
  const date = new Date(dateString);

  if (isDate(date)) {
    return date;
  }
  if (isDate(new Date(first10))) {
    return new Date(first10);
  }
  const year = Number(dateString.substring(0, 4));
  if (!Number.isNaN(year)) {
    const yearDate = new Date(`${year}-01-01`);
    if (isDate(yearDate)) {
      return yearDate;
    }
  }
  return null;
}

// Finders

async function findFirstGenre(genreName: string) {
  return prisma.genre.findFirst({
    where: { name: { equals: genreName, mode: 'insensitive' } },
  });
}

async function findFirstArtist(artistName: string) {
  return prisma.artist.findFirst({
    where: { name: { equals: artistName, mode: 'insensitive' } },
  });
}

async function findFirstAlbum(albumTitle: string, artistID: number) {
  return prisma.album.findFirst({
    where: { title: { equals: albumTitle, mode: 'insensitive' }, artist_id: artistID },
  });
}

async function findFirstTrack(title: string, duration: number) {
  return prisma.track.findFirst({
    where: { title: { equals: title, mode: 'insensitive' }, duration: duration },
  });
}

// Creators

async function createGenre(genreName: string) {
  return prisma.genre.create({ data: { name: genreName } });
}

async function createArtist(artistName: string) {
  return prisma.artist.create({ data: { name: artistName } });
}

async function createAlbum(albumTitle: string, artistID: number, date: any, coverUrl: string | null) {
  return prisma.album.create({
    data: {
      title: albumTitle,
      artist_id: artistID,
      release_date: getDate(date),
      cover_art_url: coverUrl,
    },
  });
}

async function createTrack(
  trackTitle: string,
  date: any,
  duration: number,
  coverUrl: string | null,
  albumID: number | null,
  genreIDs: number[],
) {
  return prisma.track.create({
    data: {
      title: trackTitle,
      release_date: getDate(date),
      duration: duration,
      cover_art_url: coverUrl,
      album: albumID ? { connect: { album_id: albumID } } : undefined,
      genres: genreIDs.length > 0
        ? { create: genreIDs.map((genre_id) => ({ genre_id })) }
        : undefined,
    },
  });
}

async function findSequenceSlot(albumID: number, sequenceNumber: number) {
  return prisma.albumTrackSequence.findUnique({
    where: { album_id_sequence_number: { album_id: albumID, sequence_number: sequenceNumber } },
  });
}

async function attachTrackToAlbumPosition(albumID: number, trackID: number, sequenceNumber: number) {
  // Upsert on (album_id, sequence_number): if some other track already claims
  // this slot (data anomaly) this will throw on the (album_id, track_id)
  // primary key instead, which the caller catches and logs — same as before,
  // just no longer silently leaving a freshly-created track un-slotted when
  // it should have been recognized as filling an already-occupied position.
  return prisma.albumTrackSequence.upsert({
    where: { album_id_sequence_number: { album_id: albumID, sequence_number: sequenceNumber } },
    update: {},
    create: { album_id: albumID, track_id: trackID, sequence_number: sequenceNumber },
  });
}

async function createTrackContributor(trackID: number, artistID: number, role: string = 'artist') {
  // (track_id, artist_id, role) is a unique constraint — upsert instead of
  // create so re-ingesting a file (e.g. watcher re-processing an upload)
  // never throws on a duplicate contributor row.
  return prisma.trackContributor.upsert({
    where: { track_id_artist_id_role: { track_id: trackID, artist_id: artistID, role } },
    update: {},
    create: { track_id: trackID, artist_id: artistID, role },
  });
}

async function createTrackFile(
  trackID: number,
  filePath: string,
  fileHash: string,
  bitrate: number,
  sampleRate: number,
  channels: number,
  codec: string,
) {
  return prisma.trackFile.create({
    data: {
      track_id: trackID,
      storage_path_url: filePath,
      file_hash: fileHash,
      bitrate: bitrate,
      sample_rate: sampleRate,
      channels: channels,
      codec: codec,
      file_mtime: new Date(),
    },
  });
}

/**
 * Resolves genre name(s) to genre IDs, creating any that don't exist yet.
 */
async function resolveGenreIDs(genres: string[]): Promise<number[]> {
  const names = genres.map((g) => g.trim()).filter(Boolean);
  const uniqueNames = names.length > 0 ? Array.from(new Set(names)) : ['Unknown'];

  const ids: number[] = [];
  for (const name of uniqueNames) {
    const existing = await findFirstGenre(name);
    ids.push(existing ? existing.genre_id : (await createGenre(name)).genre_id);
  }
  return ids;
}

/**
 * Kicks off a best-effort, non-blocking artist image fetch for any artist
 * that doesn't have one yet — used for the primary artist and for every
 * featured/contributing artist, so a track's "ft." credits get pictures
 * too, not just whoever the album is filed under.
 */
function ensureArtistImage(artistID: number, artistName: string, hasImage: boolean) {
  if (artistName === 'Unknown Artist' || hasImage) return;

  fetchArtistImage(artistName)
    .then((imageUrl) => {
      if (imageUrl) {
        return prisma.artist.update({ where: { artist_id: artistID }, data: { image_url: imageUrl } });
      }
    })
    .catch((err) => console.error(`Could not set artist image for ${artistName}:`, err));
}

/**
 * Resolves the artist/album for a track, creating either as needed.
 * Returns the artistID, albumID, and the best album cover art known
 * synchronously (so the calling track can inherit it if it has none of its
 * own). Also fills in artwork — from this track's embedded tags if present,
 * otherwise a best-effort lookup via Deezer/MusicBrainz — for any artist or
 * album that doesn't have it yet, and backfills that art onto any sibling
 * tracks in the album that don't have their own cover_art_url either.
 *
 * The external lookups are fired off without being awaited: they're
 * supplementary (a missing picture shouldn't hold up ingesting the actual
 * audio), and MusicBrainz in particular is rate-limited to ~1 req/sec, which
 * would otherwise noticeably slow down a big batch upload of new artists.
 * The artist/album row exists immediately either way; its image (and any
 * tracks waiting on it) just fill in a little later once the network call
 * resolves.
 */
async function resolveArtistAndAlbum(
  artistName: string,
  albumName: string,
  date: any,
  coverUrl: string | null,
): Promise<{ artistID: number; albumID: number; albumCoverUrl: string | null }> {
  const effectiveArtist = artistName || 'Unknown Artist';

  const existingArtist = await findFirstArtist(effectiveArtist);
  const artistID = existingArtist ? existingArtist.artist_id : (await createArtist(effectiveArtist)).artist_id;

  ensureArtistImage(artistID, effectiveArtist, Boolean(existingArtist?.image_url));

  const effectiveAlbum = albumName || 'Unknown Album';
  const existingAlbum = await findFirstAlbum(effectiveAlbum, artistID);

  let albumID: number;
  let albumCoverUrl: string | null;
  let stillNeedsCoverArt: boolean;

  if (existingAlbum) {
    albumID = existingAlbum.album_id;
    albumCoverUrl = existingAlbum.cover_art_url;
    stillNeedsCoverArt = !existingAlbum.cover_art_url;
  } else {
    const newAlbum = await createAlbum(effectiveAlbum, artistID, date, effectiveAlbum === 'Unknown Album' ? null : coverUrl);
    albumID = newAlbum.album_id;
    albumCoverUrl = newAlbum.cover_art_url;
    stillNeedsCoverArt = effectiveAlbum !== 'Unknown Album' && !coverUrl;
  }

  // Any track in this album (besides the one currently being ingested,
  // which isn't created yet at this point) that doesn't have its own
  // cover_art_url should pick up the album's — otherwise a track ingested
  // before the album had any art stays blank forever even after the album
  // gets one, whether from a later track's embedded art or an API fetch.
  async function backfillSiblingTracks(artUrl: string) {
    await prisma.track.updateMany({
      where: { album_id: albumID, cover_art_url: null },
      data: { cover_art_url: artUrl },
    });
  }

  // Skip the synthetic 'Unknown Album' bucket entirely — it isn't a real
  // album and shouldn't get art from either this track or an API lookup.
  if (stillNeedsCoverArt && effectiveAlbum !== 'Unknown Album') {
    if (coverUrl) {
      // This track had its own embedded art and the album didn't yet —
      // prefer that over an API lookup, and it's already local, so do it
      // immediately rather than as a background fetch.
      await prisma.album.update({ where: { album_id: albumID }, data: { cover_art_url: coverUrl } });
      albumCoverUrl = coverUrl;
      await backfillSiblingTracks(coverUrl).catch((err) => {
        console.error(`Could not backfill track art for album ${effectiveAlbum}:`, err);
      });
    } else {
      fetchAlbumArt(effectiveArtist, effectiveAlbum)
        .then(async (artUrl) => {
          if (artUrl) {
            await prisma.album.update({ where: { album_id: albumID }, data: { cover_art_url: artUrl } });
            await backfillSiblingTracks(artUrl);
          }
        })
        .catch((err) => console.error(`Could not set album art for ${effectiveAlbum}:`, err));
    }
  }

  return { artistID, albumID, albumCoverUrl };
}

// The upload route and the watcher can both call ingestTrackFile() for the
// exact same path at roughly the same time (route ingests right after
// saving; the watcher's chokidar 'add' event fires ~2s later on its own
// timer, and those can overlap). The storage_path_url check at the top of
// the function is a plain SELECT, not a lock — two concurrent calls can
// both see "not found" before either one's INSERT commits, and the second
// INSERT then fails on the unique constraint. This map makes concurrent
// calls for the same path share a single in-flight execution instead of
// both racing through it.
const inFlightIngests = new Map<string, Promise<IngestResult>>();

/**
 * Ingests a single song file: hashes it for dedup, extracts metadata, and
 * creates (or reuses) the corresponding Artist/Album/Genre/Track/TrackFile
 * rows. Safe to call more than once for the same path (idempotent) so both
 * the upload route and the watcher can call it without double-processing.
 */
export async function ingestTrackFile(filePath: string): Promise<IngestResult> {
  const existing = inFlightIngests.get(filePath);
  if (existing) return existing;

  const promise = ingestTrackFileOnce(filePath).finally(() => {
    inFlightIngests.delete(filePath);
  });
  inFlightIngests.set(filePath, promise);
  return promise;
}

async function ingestTrackFileOnce(filePath: string): Promise<IngestResult> {
  try {
    // 1. Already indexed at this exact path? (e.g. the watcher re-observing
    // a file the upload route already ingested.) Skip the expensive work.
    const alreadyAtPath = await prisma.trackFile.findUnique({ where: { storage_path_url: filePath } });
    if (alreadyAtPath) {
      const track = await prisma.track.findUnique({ where: { track_id: alreadyAtPath.track_id } });
      return { status: 'exists', filePath, trackId: alreadyAtPath.track_id, title: track?.title ?? 'Unknown' };
    }

    // 2. Hash the content. If we already have this exact audio stored under
    // a different path, treat this copy as a redundant duplicate and remove
    // it rather than creating a second Track/TrackFile for the same audio.
    const fileHash = await hashFile(filePath);
    const existingByHash = await prisma.trackFile.findUnique({ where: { file_hash: fileHash } });
    if (existingByHash) {
      await fs.unlink(filePath).catch((err) => {
        console.error(`Could not remove duplicate file ${filePath}:`, err);
      });
      const track = await prisma.track.findUnique({ where: { track_id: existingByHash.track_id } });
      return {
        status: 'duplicate',
        filePath,
        trackId: existingByHash.track_id,
        title: track?.title ?? 'Unknown',
      };
    }

    // 3. Parse tags and resolve/create related records.
    const metadata = await extractMetadata(filePath);

    const genreIDs = await resolveGenreIDs(metadata.genres);
    const { artistID, albumID, albumCoverUrl } = await resolveArtistAndAlbum(
      metadata.artist,
      metadata.album,
      metadata.date,
      metadata.cover_url,
    );

    const trackNum = metadata.track ?? null;

    // Prefer matching by album position over title+duration string-matching.
    // A different rip/retag of the same song can have a slightly different
    // duration (encoder padding) or a differently-formatted title, which
    // would defeat a title+duration check — but if this album already has
    // *something* filling this exact track-number slot, that's much stronger
    // evidence it's the same song than a fuzzy text match is. This is what
    // was missing before: a retagged duplicate would fail both the content
    // hash check and the title+duration check, silently becoming a second,
    // "orphaned" Track attached to the album but outside its track listing.
    let track: Awaited<ReturnType<typeof findFirstTrack>> = null;
    if (albumID && trackNum) {
      const existingSlot = await findSequenceSlot(albumID, trackNum);
      if (existingSlot) {
        track = await prisma.track.findUnique({ where: { track_id: existingSlot.track_id } });
      }
    }
    if (!track) {
      track = await findFirstTrack(metadata.title, metadata.duration);
    }

    if (!track) {
      track = await createTrack(
        metadata.title,
        metadata.date,
        metadata.duration,
        // Fall back to the album's cover (embedded-art-derived or already
        // fetched) so a track with no tags of its own doesn't stay blank
        // when the album it belongs to already has art.
        metadata.cover_url ?? albumCoverUrl,
        albumID,
        genreIDs,
      );
    } else if (!track.cover_art_url && (metadata.cover_url || albumCoverUrl)) {
      // Reused track (matched by position or title+duration) that never
      // got its own art — fill it in now if we have something.
      track = await prisma.track.update({
        where: { track_id: track.track_id },
        data: { cover_art_url: metadata.cover_url ?? albumCoverUrl },
      });
    }

    // Keep the album position filled in even when reusing an existing track
    // (e.g. it was matched by title+duration but never got a sequence entry).
    if (albumID && trackNum) {
      await attachTrackToAlbumPosition(albumID, track.track_id, trackNum).catch((err) => {
        console.error(`Could not set track sequence for ${filePath}:`, err);
      });
    }

    // Contributors: kept in sync whether the track is new or reused, since a
    // different rip may carry featured-artist tags the original didn't.
    if (artistID) {
      await createTrackContributor(track.track_id, artistID, 'artist').catch((err) => {
        console.error(`Could not add primary contributor for ${filePath}:`, err);
      });
    }

    // Some tags list contributors individually (e.g. ["Drake", "Future"])
    // separately from the combined display string (e.g. "Drake & Future")
    // used to resolve the primary artist above — those don't necessarily
    // match by exact string, so any additional distinct names are added
    // as 'featured' contributors rather than assumed to be the primary.
    const extraNames = metadata.artists.filter(
      (name) => name && name !== metadata.artist && name !== 'Unknown Artist',
    );
    for (const name of Array.from(new Set(extraNames))) {
      const existingContribArtist = await findFirstArtist(name);
      const contribArtist = existingContribArtist ?? (await createArtist(name));
      ensureArtistImage(contribArtist.artist_id, name, Boolean(existingContribArtist?.image_url));
      await createTrackContributor(track.track_id, contribArtist.artist_id, 'featured').catch((err) => {
        console.error(`Could not add contributor ${name} for ${filePath}:`, err);
      });
    }

    try {
      await createTrackFile(
        track.track_id,
        filePath,
        fileHash,
        metadata.bitrate,
        metadata.sample_rate,
        metadata.channels,
        metadata.codec,
      );
    } catch (err: any) {
      // Backstop for the same race the in-flight map above prevents within
      // this process — e.g. if this were ever run as more than one process.
      // A unique-constraint failure specifically on storage_path_url means
      // someone else already inserted this exact file; that's a success,
      // not an error.
      if (err?.code === 'P2002' && err?.meta?.target?.includes?.('storage_path_url')) {
        const already = await prisma.trackFile.findUnique({ where: { storage_path_url: filePath } });
        return {
          status: 'exists',
          filePath,
          trackId: already?.track_id ?? track.track_id,
          title: track.title,
        };
      }
      throw err;
    }

    return {
      status: 'created',
      filePath,
      trackId: track.track_id,
      title: track.title,
    };
  } catch (error: any) {
    console.error(`Error ingesting ${filePath}:`, error);
    return { status: 'error', filePath, message: error?.message ?? 'Unknown ingest error' };
  }
}