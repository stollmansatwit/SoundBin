import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';

const router = Router();

// This matches the path: /api/album-path (or whatever prefix you give it)
router.get('/album-path', async (_req: Request, res: Response) => {
  try {
    // Fetch albums and their cover art from your database
    const albums = await prisma.album.findMany({
      select: {
        album_id: true,
        title: true,
        cover_art_url: true, // This should contain the path like "/uploads/assets/xxx.jpg"
      },
    });

    res.json(albums);
  } catch (error) {
    console.error("Error fetching album paths:", error);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

export default router;