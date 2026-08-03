/**
 * @file    Express routes for playlist management
 * @module  PlaylistRoutes
 * @author  Ian MacDougall
 * @version 1.0
 */

import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';

const router = Router();

/**
 * GET `/api/playlists`
 * Fetches all playlists to be displayed to user
 */
router.get('/playlists', async (_req: Request, res: Response) => {
  try {
    const playlists = await prisma.playlist.findMany({
      select: {
        playlist_id: true,
        user_id: true,
        name: true,
        description: true,
        source_type: true,
        date_created: true,
        cover_art_url: true,
      },
      orderBy: { date_created: 'desc' },
    });
    res.json(playlists);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

/**
 * GET `/api/playlist/:id`
 * Fetches a single playlist by id
 */
router.get('/playlist/:id', async (req: Request, res: Response) => {
  try {
    const playlistId = Number(req.params.id);
    if (isNaN(playlistId)) return res.status(400).json({ error: "Invalid playlist ID" });

    const playlist = await prisma.playlist.findUnique({
      where: { playlist_id: playlistId },
    });

    if (!playlist) return res.status(404).json({ error: "Playlist not found" });
    res.json(playlist);
  } catch (error) {
    console.error("Error fetching playlist:", error);
    res.status(500).json({ error: "Failed to fetch playlist" });
  }
});

/**
 * POST /api/playlists
 * Creates a new, empty playlist
 */
router.post('/playlists', async (req: Request, res: Response) => {
  try {
    const { name, cover_art_url, user_id, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: "Playlist name is required" });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        cover_art_url: cover_art_url ?? null,
        user_id: typeof user_id === 'number' ? user_id : null,
      },
    });

    res.status(201).json(playlist);
  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

/**
 * PATCH `/api/playlists/:id`
 * Edits the basics of a playlist (name, description, cover art) and/or
 * its track sequence.
 *
 * `trackOrder`, if provided, is the full list of the playlist's track
 * ids in the desired order; each item's sequence_number is rewritten to
 * match its (1-based) position in that list.
 */
router.patch('/playlists/:id', async (req: Request, res: Response) => {
  try {
    const playlistId = Number(req.params.id);
    if (isNaN(playlistId)) return res.status(400).json({ error: "Invalid playlist ID" });

    const { name, description, cover_art_url, trackOrder } = req.body;
    const data: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (typeof description === 'string' || description === null) data.description = description;
    if (typeof cover_art_url === 'string' || cover_art_url === null) data.cover_art_url = cover_art_url;

    if (Object.keys(data).length > 0) {
      await prisma.playlist.update({ where: { playlist_id: playlistId }, data });
    }

    if (Array.isArray(trackOrder)) {
      const trackIds = trackOrder.map(Number).filter((id) => !isNaN(id));
      // Two passes to avoid transiently colliding with the
      // @@unique([playlist_id, sequence_number]) constraint: first push
      // every row's sequence number out of the way, then assign the real
      // order.
      await prisma.$transaction(
        trackIds.map((trackId, index) =>
          prisma.playlistItem.updateMany({
            where: { playlist_id: playlistId, track_id: trackId },
            data: { sequence_number: -(index + 1) },
          })
        )
      );
      await prisma.$transaction(
        trackIds.map((trackId, index) =>
          prisma.playlistItem.updateMany({
            where: { playlist_id: playlistId, track_id: trackId },
            data: { sequence_number: index + 1 },
          })
        )
      );
    }

    const playlist = await prisma.playlist.findUnique({ where: { playlist_id: playlistId } });
    res.json(playlist);
  } catch (error) {
    console.error("Error updating playlist:", error);
    res.status(500).json({ error: "Failed to update playlist" });
  }
});

/**
 * DELETE `/api/playlists/:id`
 * Deletes a playlist. Refuses if the playlist still has tracks in it —
 * playlists should only be deleted once they're empty, so this is a
 * server-side guard in addition to the frontend only exposing the
 * option when the track count is zero.
 */
router.delete('/playlists/:id', async (req: Request, res: Response) => {
  try {
    const playlistId = Number(req.params.id);
    if (isNaN(playlistId)) return res.status(400).json({ error: "Invalid playlist ID" });

    const itemCount = await prisma.playlistItem.count({ where: { playlist_id: playlistId } });
    if (itemCount > 0) {
      return res.status(400).json({ error: "Cannot delete a playlist that still has tracks" });
    }

    await prisma.playlist.delete({ where: { playlist_id: playlistId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    res.status(500).json({ error: "Failed to delete playlist" });
  }
});

/**
 * GET `/api/playlist-tracks?id=<number>`
 * Fetches all tracks belonging to a playlist, in order, with enough
 * track data (files, duration, etc.) to be queued for playback.
 */
router.get('/playlist-tracks', async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Playlist ID is required" });
    const playlistId = Number(id);
    if (isNaN(playlistId)) return res.status(400).json({ error: "Invalid playlist ID" });

    const items = await prisma.playlistItem.findMany({
      where: { playlist_id: playlistId },
      orderBy: { sequence_number: 'asc' },
      include: {
        track: {
          include: {
            files: true,
            albumSequence: true,
          },
        },
      },
    });

    const tracks = items.map((item) => ({
      ...item.track,
      playlist_item_id: item.playlist_item_id,
      sequence_number: item.sequence_number,
    }));

    res.json(tracks);
  } catch (error) {
    console.error("Error fetching playlist tracks:", error);
    res.status(500).json({ error: "Failed to fetch playlist tracks" });
  }
});

/**
 * POST `/api/playlist-items`
 * Adds a track to a playlist (appended to the end). No-ops if the track
 * is already in the playlist.
 */
router.post('/playlist-items', async (req: Request, res: Response) => {
  try {
    const { playlist_id, track_id } = req.body;
    const playlistId = Number(playlist_id);
    const trackId = Number(track_id);
    if (isNaN(playlistId) || isNaN(trackId)) {
      return res.status(400).json({ error: "playlist_id and track_id are required" });
    }

    const existing = await prisma.playlistItem.findFirst({
      where: { playlist_id: playlistId, track_id: trackId },
    });
    if (existing) {
      return res.status(200).json(existing);
    }

    const last = await prisma.playlistItem.findFirst({
      where: { playlist_id: playlistId },
      orderBy: { sequence_number: 'desc' },
    });
    const nextSequence = (last?.sequence_number ?? 0) + 1;

    const item = await prisma.playlistItem.create({
      data: {
        playlist_id: playlistId,
        track_id: trackId,
        sequence_number: nextSequence,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Error adding track to playlist:", error);
    res.status(500).json({ error: "Failed to add track to playlist" });
  }
});

/**
 * DELETE `/api/playlist-items`
 * Removes a track from a playlist.
 */
router.delete('/playlist-items', async (req: Request, res: Response) => {
  try {
    const { playlist_id, track_id } = req.body;
    const playlistId = Number(playlist_id);
    const trackId = Number(track_id);
    if (isNaN(playlistId) || isNaN(trackId)) {
      return res.status(400).json({ error: "playlist_id and track_id are required" });
    }

    await prisma.playlistItem.deleteMany({
      where: { playlist_id: playlistId, track_id: trackId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing track from playlist:", error);
    res.status(500).json({ error: "Failed to remove track from playlist" });
  }
});

/**
 * GET `/api/track-playlists?trackID=<number>`
 * Given a track, returns the ids of every playlist that already
 * contains it — used to pre-check playlists in the "Add to Playlist" UI.
 */
router.get('/track-playlists', async (req: Request, res: Response) => {
  try {
    const { trackID } = req.query;
    if (!trackID) return res.status(400).json({ error: "Track ID is required" });
    const trackId = Number(trackID);
    if (isNaN(trackId)) return res.status(400).json({ error: "Invalid Track ID" });

    const items = await prisma.playlistItem.findMany({
      where: { track_id: trackId },
      select: { playlist_id: true },
    });

    res.json(items.map((item) => item.playlist_id));
  } catch (error) {
    console.error("Error fetching track playlists:", error);
    res.status(500).json({ error: "Failed to fetch track playlists" });
  }
});

export default router;
