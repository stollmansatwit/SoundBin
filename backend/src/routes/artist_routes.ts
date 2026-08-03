/**
 * @file    Express routes for artist management
 * @module  ArtistRoutes
 * @author  Ian MacDougall
 * @version 1.0
 */

import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';
import { getRecentListens } from '../lib/activity';

const router = Router();

/**
 * GET /api/artist-name?id=<number>
 * uses `/api/artist-name` to fetch name of artist by Artist ID from database
 */
router.get('/artist-name', async (req: Request, res: Response) => {
  try {
    const {id} = req.query;
    if (!id) { return res.status(400).json({error: "Artist ID is required"}); }

    const artist = await prisma.artist.findUnique({
        where: { artist_id: Number(id)}, 
        select: { name: true },
    });
    if (!artist) {return res.status(400).json({error: "Artist not found"});}
    res.json({name: artist.name});
  } catch (error) {
    console.error("Error fetching artist name:", error);
    res.status(500).json({ error: "Failed to fetch artist name" });
  }
});


/**
 * GET /api/artist/:id
 * Fetches a single artist by id (full row)
 */
router.get('/artist/:id', async (req: Request, res: Response) => {
  try {
    const artistId = Number(req.params.id);
    if (isNaN(artistId)) return res.status(400).json({ error: "Invalid Artist ID" });

    const artist = await prisma.artist.findUnique({ where: { artist_id: artistId } });
    if (!artist) return res.status(404).json({ error: "Artist not found" });
    res.json(artist);
  } catch (error) {
    console.error("Error fetching artist:", error);
    res.status(500).json({ error: "Failed to fetch artist" });
  }
});

/**
 * GET /api/artist/:id
 * Lists every artist, alphabetically — used to populate the artist
 * picker in the track/album edit modals.x
 */
router.get('/artists', async (_req: Request, res: Response) => {
  try {
    const artists = await prisma.artist.findMany({
      select: { artist_id: true, name: true, image_url: true },
      orderBy: { name: 'asc' },
    });
    res.json(artists);
  } catch (error) {
    console.error("Error fetching artists:", error);
    res.status(500).json({ error: "Failed to fetch artists" });
  }
});

/**
 * POST /api/artists
 * Finds an existing artist by (case-insensitive) name, or creates a new
 * one — powers the "create a new artist" option in the track/album edit
 * modals' artist picker.
 */
router.post('/artists', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: "Artist name is required" });
    }
    const trimmed = name.trim();

    let artist = await prisma.artist.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (!artist) {
      artist = await prisma.artist.create({ data: { name: trimmed } });
    }

    res.status(201).json(artist);
  } catch (error) {
    console.error("Error creating artist:", error);
    res.status(500).json({ error: "Failed to create artist" });
  }
});

/**
 * PATCH /api/artists/:id
 * Edits an artist's name and/or image.
 */
router.patch('/artists/:id', async (req: Request, res: Response) => {
  try {
    const artistId = Number(req.params.id);
    if (isNaN(artistId)) return res.status(400).json({ error: "Invalid Artist ID" });

    const { name, image_url } = req.body;
    const data: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (typeof image_url === 'string' || image_url === null) data.image_url = image_url;

    const artist = await prisma.artist.update({
      where: { artist_id: artistId },
      data,
    });

    res.json(artist);
  } catch (error) {
    console.error("Error updating artist:", error);
    res.status(500).json({ error: "Failed to update artist" });
  }
});

/**
 * GET /api/artist-path
 * Uses `/api/artist-path` to fetch cover art from database
 * Sorted by track number, if null then by mtime
 */
router.get('/artist-path', async (_req: Request, res: Response) => {
  try {
    const artists = await prisma.artist.findMany({
      select: {
        artist_id: true,
        name: true,
        bio: true,
        image_url: true,
      },
    });

    res.json(artists);
  } catch (error) {
    console.error("Error fetching album paths:", error);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});



/**
 * GET /api/artist-albums?artistID=<number>
 * Uses `/api/artist-albums` to fetch cover art from database
 * Sorted by track number, if null then by mtime
 */
router.get('/artist-albums', async (req: Request, res: Response) => {
  try {
    const {artistID} = req.query;
    if (!artistID) { return res.status(400).json({error: "Artist ID is required"}); }
    const artistIDnum = Number(artistID);
    if (isNaN(artistIDnum)) {res.status(400).json({ error: "Invalid Artist ID" });}

    const albums = await prisma.album.findMany({
      where: { artist_id: artistIDnum },
      orderBy: { release_date: 'desc' },
      select: { 
        album_id: true,
        title: true,
        release_date: true,
        cover_art_url: true,
        artist_id: true
      },
    });

    res.json(albums);
  } catch (error) {
    console.error("Error fetching album paths:", error);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});


/**
 * GET `/api/artist-tracks?artistID=<number>`
 * Uses `/api/artist-tracks` to fetch cover art from database
 * Sorted by track number, if null then by mtime
 */
router.get('/artist-tracks', async (req: Request, res: Response) => {
  try {
    const { artistID } = req.query;
    if (!artistID) { return res.status(400).json({ error: "Artist ID is required" }); }

    const artistIdNum = Number(artistID);
    if (isNaN(artistIdNum)) { return res.status(400).json({ error: "Invalid Artist ID" }); }

    // 1. Fetch tracks with their files and contributors
    const tracks = await prisma.track.findMany({
      where: {
        contributors: {
          some: {
            artist_id: artistIdNum,
          },
        },
      },
      include: {
        files: true, // Include files to get mtime
        contributors: {
          where: {
            artist_id: artistIdNum,
          },
          select: {
            role: true,
          },
        },
      },
    });

    // 2. Sort in-memory by the most recent file modification time
    const sortedTracks = tracks.sort((a, b) => {
      // Get the latest mtime for track A
      const maxTimeA = a.files.length > 0 
        ? Math.max(...a.files.map(f => new Date(f.file_mtime).getTime())) 
        : 0;
      
      // Get the latest mtime for track B
      const maxTimeB = b.files.length > 0 
        ? Math.max(...b.files.map(f => new Date(f.file_mtime).getTime())) 
        : 0;

      // Sort descending (newest first). Use 'asc' for oldest first.
      return maxTimeB - maxTimeA;
    });

    // 3. Format the response to remove heavy file data if not needed in the popup view
    const formattedTracks = sortedTracks.map(track => ({
      track_id: track.track_id,
      title: track.title,
      duration: track.duration,
      cover_art_url: track.cover_art_url,
      contributors: track.contributors,
      // We can optionally include one representative file date if needed
      last_modified: track.files.length > 0 
        ? new Date(Math.max(...track.files.map(f => new Date(f.file_mtime).getTime()))).toISOString()
        : null
    }));

    res.json(formattedTracks);
  } catch (error) {
    console.error("Error fetching album paths:", error);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});



/**
 * GET `/api/artist-playlists?artistID=<number>`
 * @description Playlists that contain at least one track this artist contributed to.
 * Powers the "Featured In Playlists" section on the artist page.
 */
router.get('/artist-playlists', async (req: Request, res: Response) => {
  try {
    const { artistID } = req.query;
    if (!artistID) return res.status(400).json({ error: "Artist ID is required" });
    const artistIdNum = Number(artistID);
    if (isNaN(artistIdNum)) return res.status(400).json({ error: "Invalid Artist ID" });

    const playlists = await prisma.playlist.findMany({
      where: {
        items: {
          some: {
            track: {
              contributors: {
                some: { artist_id: artistIdNum },
              },
            },
          },
        },
      },
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
    console.error("Error fetching artist playlists:", error);
    res.status(500).json({ error: "Failed to fetch artist playlists" });
  }
});

/**
 * GET `/api/artist-recent-listens?artistID=<number>&limit=<number>`
 *  Most recently listened-to tracks (deduplicated by track) for tracks this
 * artist contributed to. Powers the "Recently Listened To" section on the artist page.
 * `limit` - max number of tracks to return (default 12, max 50)
 */
router.get('/artist-recent-listens', async (req: Request, res: Response) => {
  try {
    const { artistID } = req.query;
    if (!artistID) return res.status(400).json({ error: "Artist ID is required" });
    const artistIdNum = Number(artistID);
    if (isNaN(artistIdNum)) return res.status(400).json({ error: "Invalid Artist ID" });

    const limit = Math.min(Number(req.query.limit) || 12, 50);

    const recent = await getRecentListens(
      { track: { contributors: { some: { artist_id: artistIdNum } } } },
      limit,
    );

    res.json(recent);
  } catch (error) {
    console.error("Error fetching artist recent listens:", error);
    res.status(500).json({ error: "Failed to fetch artist recent listens" });
  }
});

export default router;