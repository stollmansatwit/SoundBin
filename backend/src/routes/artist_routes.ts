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

export default router;