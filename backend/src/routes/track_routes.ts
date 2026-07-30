import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';

const router = Router();

/**
 * @param get `/api/tracks`
 */
router.get('/tracks', async (_req: Request, res: Response) => {
  try {
    const tracks = await prisma.track.findMany({
      select: {
        track_id: true,
        title: true,
        cover_art_url: true,
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
    const trackId = parseInt(req.params.trackId as string);
    
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
        },
        albumSequence: true,
        genres: {
          include: { genre: { select: { genre_id: true, name: true } } },
        },
        contributors: {
          where: { role: 'artist' },
          include: { artist: { select: { artist_id: true, name: true } } },
        },
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


/**
 * Edits a track: title, cover art, release date, genres, and contributing
 * artists. `genreIds`/`artistIds` (if provided) fully replace the track's
 * existing genre/artist associations with the given set — genres and
 * artists themselves are expected to already exist (created up-front via
 * `POST /api/genres` / `POST /api/artists` from the "create new" option
 * in the picker UI) so this endpoint just links the ids.
 * @param patch `/api/tracks/:trackId`
 * @body { title?: string, cover_art_url?: string, release_date?: string | null,
 *         genreIds?: number[], artistIds?: number[] }
 */
router.patch('/tracks/:trackId', async (req: Request, res: Response) => {
  try {
    const trackId = parseInt(req.params.trackId as string);
    if (isNaN(trackId)) return res.status(400).json({ error: "Invalid track ID" });

    const { title, cover_art_url, release_date, genreIds, artistIds } = req.body;
    const data: Record<string, unknown> = {};

    if (typeof title === 'string' && title.trim()) {
      data.title = title.trim();
    }

    if (typeof cover_art_url === 'string' || cover_art_url === null) {
      data.cover_art_url = cover_art_url;
    }

    if (typeof release_date === 'string' || release_date === null) {
      data.release_date = release_date ? new Date(release_date) : null;
    }

    if (Object.keys(data).length > 0) {
      await prisma.track.update({ where: { track_id: trackId }, data });
    }

    if (Array.isArray(genreIds)) {
      const ids = genreIds.map(Number).filter((id) => !isNaN(id));
      await prisma.trackGenre.deleteMany({ where: { track_id: trackId } });
      if (ids.length > 0) {
        await prisma.trackGenre.createMany({
          data: ids.map((genre_id) => ({ track_id: trackId, genre_id })),
          skipDuplicates: true,
        });
      }
    }

    if (Array.isArray(artistIds)) {
      const ids = artistIds.map(Number).filter((id) => !isNaN(id));
      await prisma.trackContributor.deleteMany({ where: { track_id: trackId, role: 'artist' } });
      if (ids.length > 0) {
        await prisma.trackContributor.createMany({
          data: ids.map((artist_id) => ({ track_id: trackId, artist_id, role: 'artist' })),
          skipDuplicates: true,
        });
      }
    }

    const track = await prisma.track.findUnique({
      where: { track_id: trackId },
      include: {
        files: true,
        album: { select: { title: true } },
        albumSequence: true,
        genres: { include: { genre: { select: { genre_id: true, name: true } } } },
        contributors: {
          where: { role: 'artist' },
          include: { artist: { select: { artist_id: true, name: true } } },
        },
      },
    });

    res.json(track);
  } catch (error) {
    console.error("Error updating track:", error);
    res.status(500).json({ error: "Failed to update track" });
  }
});

router.get('/track-artist', async (req: Request, res: Response) => {
    const {trackID} = req.query;
    if (!trackID) { return res.status(400).json({error: "Track ID is required"});}
    const trackIDnum = Number(trackID);
    if (isNaN(trackIDnum)) {res.status(400).json({ error: "Invalid Track ID" });}

    try {
      const artist = await prisma.track.findUnique({
      where: { track_id: trackIDnum},
      select: {
        contributors: {
          where: { role: 'artist' },
          select: {
            artist: {
              select: { name: true, artist_id: true},
            }
          }
        }
      }
    });
    res.json(artist)
    } catch (error) {
      console.error("Error fetching track artist:", error);
      res.status(500).json({ error: "Failed to fetch track artist" });
    }
  });



export default router;