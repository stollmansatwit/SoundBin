import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';

const router = Router();

/**
 * @param get /api/album-path
 * @description uses /api/album-path to fetch cover art from database
 */
router.get('/album-path', async (_req: Request, res: Response) => {
  try {
    const albums = await prisma.album.findMany({
      select: {
        album_id: true,
        title: true,
        cover_art_url: true,
      },
    });

    res.json(albums);
  } catch (error) {
    console.error("Error fetching album paths:", error);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});


/**
 * @param get /api/album-tracks
 * @description uses /api/album-tracks to fetch songs from database
 */
router.get('/album-tracks', async (_req: Request, res: Response) => {
  try {

  } catch (error) {
    console.error("Error fetching tracks from album:", error);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

export default router;