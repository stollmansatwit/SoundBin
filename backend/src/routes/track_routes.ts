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
        albumSequence: true
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
 * Edits the basics of a track: title, contributing artist (by name), and
 * album (by title). An existing artist/album with that name is reused,
 * otherwise a new one is created.
 * @param patch `/api/tracks/:trackId`
 */
router.patch('/tracks/:trackId', async (req: Request, res: Response) => {
  try {
    const trackId = parseInt(req.params.trackId as string);
    if (isNaN(trackId)) return res.status(400).json({ error: "Invalid track ID" });

    const { title, artistName, albumTitle } = req.body;
    const data: Record<string, unknown> = {};

    if (typeof title === 'string' && title.trim()) {
      data.title = title.trim();
    }

    if (typeof albumTitle === 'string' && albumTitle.trim()) {
      let album = await prisma.album.findFirst({ where: { title: albumTitle.trim() } });
      if (!album) {
        album = await prisma.album.create({ data: { title: albumTitle.trim() } });
      }
      data.album_id = album.album_id;
    }

    if (Object.keys(data).length > 0) {
      await prisma.track.update({ where: { track_id: trackId }, data });
    }

    if (typeof artistName === 'string' && artistName.trim()) {
      let artist = await prisma.artist.findFirst({ where: { name: artistName.trim() } });
      if (!artist) {
        artist = await prisma.artist.create({ data: { name: artistName.trim() } });
      }

      const existingContributor = await prisma.trackContributor.findFirst({
        where: { track_id: trackId, role: 'artist' },
      });

      if (existingContributor) {
        await prisma.trackContributor.update({
          where: { contribution_id: existingContributor.contribution_id },
          data: { artist_id: artist.artist_id },
        });
      } else {
        await prisma.trackContributor.create({
          data: { track_id: trackId, artist_id: artist.artist_id, role: 'artist' },
        });
      }
    }

    const track = await prisma.track.findUnique({
      where: { track_id: trackId },
      include: { files: true, album: { select: { title: true } }, albumSequence: true },
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