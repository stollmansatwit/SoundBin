import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';

const router = Router();

/**
 * @param get `/api/playlist`
 */
router.get('/playlist/:playlistItems', async (req: Request, res: Response) => {
  try {
    const newPlaylist = await prisma.playlist.create({
      data: {
        playlist_id: 0,
        name: "first Playlist",
        items: req.params.playlistItems,
        date_created: new Date(),
        // Do NOT include files here to keep the list response fast
      },
    });
    res.json(newPlaylist);
  } catch (error) {
    console.error("Error creating playlists:", error);
    res.status(500).json({ error: "Failed to create playlists" });
  }
});


export default router;