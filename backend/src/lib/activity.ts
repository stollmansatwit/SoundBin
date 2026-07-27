import { Prisma } from '@prisma/client';
import { prisma } from './database';

export type RecentListenRow = {
  activity_id: number;
  played_at: Date;
  duration_played: number | null;
  track_id: number;
  title: string;
  duration: number;
  cover_art_url: string | null;
  album_id: number | null;
  album_title: string | null;
};

/**
 * Fetches recent listens matching `where`, deduplicated by track (most recent play wins),
 * newest first. Shared by the global "recently listened" list and artist-scoped ones.
 */
export async function getRecentListens(
  where: Prisma.ActivityWhereInput,
  limit: number,
): Promise<RecentListenRow[]> {
  const rows = await prisma.activity.findMany({
    where: { track_id: { not: null }, ...where },
    orderBy: { played_at: 'desc' },
    take: limit * 4, // over-fetch since we dedupe by track below
    include: {
      track: { include: { album: true } },
    },
  });

  const seen = new Set<number>();
  const recent: RecentListenRow[] = [];

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

  return recent;
}
