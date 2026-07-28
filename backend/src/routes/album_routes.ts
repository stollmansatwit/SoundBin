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
  });
  res.json(artist);
});


/**
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
 * Edits the basics of an album: title and/or artist (by name — an
 * existing artist with that name is reused, otherwise a new one is
 * created).
 */
router.patch('/albums/:id', async (req: Request, res: Response) => {
  try {
    const albumId = Number(req.params.id);
    if (isNaN(albumId)) return res.status(400).json({ error: "Invalid Album ID" });

    const { title, artistName } = req.body;
    const data: Record<string, unknown> = {};

    if (typeof title === 'string' && title.trim()) {
      data.title = title.trim();
    }

    if (typeof artistName === 'string' && artistName.trim()) {
      let artist = await prisma.artist.findFirst({ where: { name: artistName.trim() } });
      if (!artist) {
        artist = await prisma.artist.create({ data: { name: artistName.trim() } });
      }
      data.artist_id = artist.artist_id;
    }

    const album = await prisma.album.update({
      where: { album_id: albumId },
      data,
    });

    res.json(album);
  } catch (error) {
    console.error("Error updating album:", error);
    res.status(500).json({ error: "Failed to update album" });
  }
});

/**
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