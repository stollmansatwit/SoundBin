import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';

const router = Router();

/**
 * @param get `/api/album-path`
 * @description uses `/api/album-path` to fetch cover art from database
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
 * @param get `/api/album-track-list`
 * @description uses `/api/album-track-list` to fetch songs from database
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
 * Finds the album artist
 */
router.get('/album-artist', async (req: Request, res: Response) => {
  const {albumID} = req.query;
  if(!albumID) return res.status(400).json({error: "Album ID is required"});
  const artist = await prisma.album.findFirst({
    where:{ album_id: Number(albumID) },
    select:{ artist_id: true}
  })
})

export default router;