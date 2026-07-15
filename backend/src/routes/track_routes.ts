import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';

const router = Router();

/**
 * @param get `/api/tracks`
 */
router.get('/tracks', async (req: Request, res: Response) => {
  try {
    const tracks = await prisma.track.findMany({
      select: {
        track_id: true,
        title: true,
        album_id: true,
        duration: true,
        // Do NOT include files here to keep the list response fast
      },
    });
    res.json(tracks);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});


/**
 * @param get `/api/tracks/:trackId
 */
router.get('/tracks/:trackId', async (req: Request, res: Response) => {
  try {
    const trackId = parseInt(req.params.trackId);
    
    if (isNaN(trackId)) {
      return res.status(400).json({ error: "Invalid track ID" });
    }

    // Fetch the track and include its files
    const track = await prisma.track.findUnique({
      where: { track_id: trackId },
      include: {
        files: true, // This grabs the TrackFile[] related to this track
        album: {
          select: { title: true } // Optional: if you want album info too
        }
      }
    });

    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }

    res.json(track);
  } catch (error) {
    console.error("Error fetching track details:", error);
    res.status(500).json({ error: "Failed to fetch track details" });
  }
});




export default router;