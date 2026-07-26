import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';

const router = Router();

/**
 * @param get `/api/artist-name`
 * @description uses `/api/artist-name` to fetch name of artist by Artist ID from database
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
 * @param get `/api/artist-path`
 * @description uses `/api/artist-path` to fetch cover art from database
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
 * @param get `/api/artist-albums`
 * @description uses `/api/artist-albums` to fetch cover art from database
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
 * @param get `/api/artist-tracks`
 * @description uses `/api/artist-tracks` to fetch cover art from database
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



export default router;