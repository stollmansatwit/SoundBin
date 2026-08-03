/**
 * @file Express routes for logging and retrieving user listening activity
 * @module ActivityRoutes
 * @author Ian MacDougall
 * @version 1.0
 */

import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';
import { getRecentListens } from '../lib/activity';

const router = Router();

const DEFAULT_USERNAME = 'local_listener';

let cachedDefaultUserId: number | null = null;

/**
 * Resolves the userID for the default user, creating it if necessary.
 * 
 * @returns userID
 */
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
 * POST `/api/activity`
 * Logs the start of a track listen. Called when playback of a track begins.
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
 * PATCH `/api/activity/:id`
 * Updates duration_played for a previously logged listen, e.g. once playback
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
 * GET `/api/activity/recent`
 * Returns the most recently listened-to tracks, newest first, deduplicated
 * so the same track isn't repeated back to back.
 * `limit` - max number of tracks to return (default 12, max 50)
 */
router.get('/activity/recent', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const recent = await getRecentListens({}, limit);
    res.json(recent);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

export default router;
