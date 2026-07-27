/**
 * @file Handles logging and retrieval of user listening activity
 * @module activityRoutes
 */

import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';

const router = Router();

// NOTE: SoundBin doesn't have real auth/session wiring yet, so all listens are
// attributed to a single shared "local listener" account for now. Once login
// sessions exist, swap this out for the actual authenticated user_id.
const DEFAULT_USERNAME = 'local_listener';

let cachedDefaultUserId: number | null = null;

async function getDefaultUserId(): Promise<number> {
  if (cachedDefaultUserId !== null) {
    return cachedDefaultUserId;
  }

  const existing = await prisma.user.findUnique({ where: { username: DEFAULT_USERNAME } });
  if (existing) {
    cachedDefaultUserId = existing.user_id;
    return existing.user_id;
  }

  const created = await prisma.user.create({
    data: {
      username: DEFAULT_USERNAME,
      password_hash: 'no-login-placeholder',
      display_name: 'Local Listener',
    },
  });

  cachedDefaultUserId = created.user_id;
  return created.user_id;
}

/**
 * @param post `/api/activity`
 * @description Logs the start of a track listen. Called when playback of a track begins.
 * Returns the new activity_id so the frontend can later PATCH in the actual duration played.
 */
router.post('/activity', async (req: Request, res: Response) => {
  try {
    const trackId = Number(req.body?.track_id);
    if (!trackId) {
      return res.status(400).json({ error: 'track_id is required' });
    }

    const userId = await getDefaultUserId();
    const rawDuration = req.body?.duration_played;
    const durationPlayed = rawDuration != null ? Number(rawDuration) : null;

    const activity = await prisma.activity.create({
      data: {
        user_id: userId,
        track_id: trackId,
        duration_played: durationPlayed,
      },
    });

    res.status(201).json({ activity_id: activity.activity_id });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

/**
 * @param patch `/api/activity/:id`
 * @description Updates duration_played for a previously logged listen, e.g. once playback
 * stops, the track is skipped, or the user switches to a different track.
 */
router.patch('/activity/:id', async (req: Request, res: Response) => {
  try {
    const activityId = Number(req.params.id);
    const durationPlayed = Number(req.body?.duration_played);

    if (!activityId || Number.isNaN(durationPlayed)) {
      return res.status(400).json({ error: 'Valid activity id and duration_played are required' });
    }

    await prisma.activity.update({
      where: { activity_id: activityId },
      data: { duration_played: Math.max(0, Math.round(durationPlayed)) },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating activity duration:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

/**
 * @param get `/api/activity/recent`
 * @description Returns the most recently listened-to tracks, newest first, deduplicated
 * so the same track isn't repeated back to back.
 * @queryParam `limit` - max number of tracks to return (default 12, max 50)
 */
router.get('/activity/recent', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 50);

    const rows = await prisma.activity.findMany({
      where: { track_id: { not: null } },
      orderBy: { played_at: 'desc' },
      take: limit * 4, // over-fetch since we dedupe by track below
      include: {
        track: {
          include: { album: true },
        },
      },
    });

    const seen = new Set<number>();
    const recent: Array<{
      activity_id: number;
      played_at: Date;
      duration_played: number | null;
      track_id: number;
      title: string;
      duration: number;
      cover_art_url: string | null;
      album_id: number | null;
      album_title: string | null;
    }> = [];

    for (const row of rows) {
      if (!row.track || row.track_id === null) continue;
      if (seen.has(row.track_id)) continue;
      seen.add(row.track_id);

      recent.push({
        activity_id: row.activity_id,
        played_at: row.played_at,
        duration_played: row.duration_played,
        track_id: row.track.track_id,
        title: row.track.title,
        duration: row.track.duration,
        cover_art_url: row.track.cover_art_url ?? row.track.album?.cover_art_url ?? null,
        album_id: row.track.album_id,
        album_title: row.track.album?.title ?? null,
      });

      if (recent.length >= limit) break;
    }

    res.json(recent);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

export default router;
