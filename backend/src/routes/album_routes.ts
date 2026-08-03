/**
 * @file    Express routes for album management
 * @module  AlbumRoutes
 * @author  Ian MacDougall
 * @version 1.0
 */

import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';

const router = Router();

/**
 * GET `/api/album-path`
 * Uses `/api/album-path` to fetch cover art from database
 * Sorted by track number, if null then by mtime
 */
router.get('/album-path', async (_req: Request, res: Response) => {
  try {
    const albums = await prisma.album.findMany({
      select: {
        album_id: true,
        artist_id: true,
        title: true,
        cover_art_url: true,
        release_date: true,
      },
    });

    res.json(albums);
  } catch (error) {
    console.error("Error fetching album paths:", error);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});


/**
 * GET /api/album-track-list?id=<number>
 * Uses `/api/album-track-list` to fetch songs from database
 * 
 * @query id Album ID (required)
 */
router.get('/album-track-list', async (req: Request, res: Response) => {
  try {
    const {id} = req.query;
    if (!id) { return res.status(400).json({error: "Album ID is required"}); }

    const tracks= await prisma.track.findMany({
      where: { album_id: Number(id) },
      include: {
        albumSequence: true,
        files: true,
      },
    });

    // Sort by sequence_number first. 
    // If a track has no sequence (null), it will fall back to mtime.
    const sortedTracks = tracks.sort((a, b) => {
      const seqA = a.albumSequence?.[0]?.sequence_number;
      const seqB = b.albumSequence?.[0]?.sequence_number;

      if (seqA !== seqB) {
        // If both exist and are different, sort by sequence
        if (seqA === undefined || seqB === undefined) {
          // If one is missing a sequence, compare mtime
          return new Date(a.files?.[0]?.file_mtime).getTime() - 
                 new Date(b.files?.[0]?.file_mtime).getTime();
        }
        return seqA - seqB;
      }
      
      // If sequences are the same or both missing, sort by mtime
      return new Date(a.files?.[0]?.file_mtime).getTime() - 
             new Date(b.files?.[0]?.file_mtime).getTime();
    });

    res.json(sortedTracks);
  } catch (error) {
    console.error("Error fetching tracks from album:", error);
    res.status(500).json({ error: "Failed to fetch album tracks" });
  }
});


/**
 * GET /api/album-artist?albumID=<number>
 * Finds the album artist
 * 
 * @query albumID (required)
 */
router.get('/album-artist', async (req: Request, res: Response) => {
  const {albumID} = req.query;
  if(!albumID) return res.status(400).json({error: "Album ID is required"});
  const artist = await prisma.album.findFirst({
    where:{ album_id: Number(albumID) },
    select:{ artist_id: true}
  });
  res.json(artist);
});


/**
 * GET /api/album/:id
 * Fetches a single album by id (full row)
 */
router.get('/album/:id', async (req: Request, res: Response) => {
  try {
    const albumId = Number(req.params.id);
    if (isNaN(albumId)) return res.status(400).json({ error: "Invalid Album ID" });

    const album = await prisma.album.findUnique({ where: { album_id: albumId } });
    if (!album) return res.status(404).json({ error: "Album not found" });
    res.json(album);
  } catch (error) {
    console.error("Error fetching album:", error);
    res.status(500).json({ error: "Failed to fetch album" });
  }
});

/**
 * PATCH /api/album/:id
 * Edits an album: title, cover art, artist (by id — preferred, or by name
 * for backwards compatibility, in which case an existing artist with
 * that name is reused or a new one is created), release date, and track
 * sequence.
 *
 * `trackOrder`, if provided, is the full list of the album's track ids
 * in the desired order; each track's sequence_number is rewritten to
 * match its (1-based) position in that list.
 */
router.patch('/albums/:id', async (req: Request, res: Response) => {
  try {
    const albumId = Number(req.params.id);
    if (isNaN(albumId)) return res.status(400).json({ error: "Invalid Album ID" });

    const { title, artistName, artist_id, release_date, cover_art_url, trackOrder } = req.body;
    const data: Record<string, unknown> = {};

    if (typeof title === 'string' && title.trim()) {
      data.title = title.trim();
    }

    if (typeof cover_art_url === 'string' || cover_art_url === null) {
      data.cover_art_url = cover_art_url;
    }

    if (artist_id === null || typeof artist_id === 'number') {
      data.artist_id = artist_id;
    } else if (typeof artistName === 'string' && artistName.trim()) {
      let artist = await prisma.artist.findFirst({ where: { name: artistName.trim() } });
      if (!artist) {
        artist = await prisma.artist.create({ data: { name: artistName.trim() } });
      }
      data.artist_id = artist.artist_id;
    }

    if (typeof release_date === 'string' || release_date === null) {
      if (typeof release_date === 'string') {
        const parsed = new Date(release_date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // allow the whole current day
        if (isNaN(parsed.getTime())) {
          return res.status(400).json({ error: "Invalid release date" });
        }
        if (parsed.getTime() > today.getTime()) {
          return res.status(400).json({ error: "Release date cannot be in the future" });
        }
      }
      data.release_date = release_date ? new Date(release_date) : null;
    }

    if (Object.keys(data).length > 0) {
      await prisma.album.update({ where: { album_id: albumId }, data });
    }

    if (Array.isArray(trackOrder)) {
      const trackIds = trackOrder.map(Number).filter((id) => !isNaN(id));
      // Two passes to avoid transiently colliding with the
      // @@unique([album_id, sequence_number]) constraint: first push every
      // row's sequence number out of the way, then assign the real order.
      await prisma.$transaction(
        trackIds.map((trackId, index) =>
          prisma.albumTrackSequence.upsert({
            where: { album_id_track_id: { album_id: albumId, track_id: trackId } },
            update: { sequence_number: -(index + 1) },
            create: { album_id: albumId, track_id: trackId, sequence_number: -(index + 1) },
          })
        )
      );
      await prisma.$transaction(
        trackIds.map((trackId, index) =>
          prisma.albumTrackSequence.update({
            where: { album_id_track_id: { album_id: albumId, track_id: trackId } },
            data: { sequence_number: index + 1 },
          })
        )
      );
    }

    const album = await prisma.album.findUnique({ where: { album_id: albumId } });
    res.json(album);
  } catch (error) {
    console.error("Error updating album:", error);
    res.status(500).json({ error: "Failed to update album" });
  }
});

/**
 * DELETE /api/albums/:id
 * Deletes an album. Refuses if the album still has tracks attached —
 * albums should only be deleted once they're empty, so this is a
 * server-side guard in addition to the frontend only exposing the
 * option when the track count is zero.
 */
router.delete('/albums/:id', async (req: Request, res: Response) => {
  try {
    const albumId = Number(req.params.id);
    if (isNaN(albumId)) return res.status(400).json({ error: "Invalid Album ID" });

    const trackCount = await prisma.track.count({ where: { album_id: albumId } });
    if (trackCount > 0) {
      return res.status(400).json({ error: "Cannot delete an album that still has tracks" });
    }

    await prisma.album.delete({ where: { album_id: albumId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting album:", error);
    res.status(500).json({ error: "Failed to delete album" });
  }
});

router.get('/album-title', async (req: Request, res: Response) => {
  const {albumID} = req.query;
  if (!albumID) return res.status(400).json({error: "Album ID is required"});
  const albumIDnum = Number(albumID);
  if (isNaN(albumIDnum)) return res.status(400).json({Error: "Album ID must be a number"});
  try {
    const title = await prisma.album.findUnique({
      where: {album_id: albumIDnum},
      select: {title: true},
    });
    res.json(title);
  } catch (error) {
    console.error("Error fetching title from album:", error);
    res.status(500).json({ error: "Failed to fetch album title" });
  }
});


export default router;