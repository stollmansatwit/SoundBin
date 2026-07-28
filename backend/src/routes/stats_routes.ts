/**
 * @file Handles the Routes for file uploads
 * @module statsRoutes
 * @author  Sammy Stollman
 * @version 0
 */

import { Router } from 'express';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/database';


const router = Router();

type CountRow = {
  label: string;
  value: unknown;
};

type GenreRow = {
  label: string;
  value: unknown;
};

type TimeSeriesRow = {
  label: string;
  value: unknown;
};

const toNumber = (value: unknown) => Number(value ?? 0);

const buildListenSeriesQuery = async (
  bucket: 'day' | 'week' | 'month',
  bucketsBack: number,
  labelFormat: string,
) => {
  const interval = bucket === 'day' ? '1 day' : bucket === 'week' ? '1 week' : '1 month';

  const rows = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
    WITH buckets AS (
      SELECT generate_series(
        date_trunc(${bucket}, now()) - (${bucketsBack - 1} * ${interval}::interval),
        date_trunc(${bucket}, now()),
        ${interval}::interval
      ) AS bucket_start
    )
    SELECT
      to_char(buckets.bucket_start, ${labelFormat}) AS label,
      COUNT(activity.activity_id)::int AS value
    FROM buckets
    LEFT JOIN user_activity AS activity
      ON activity.played_at >= buckets.bucket_start
     AND activity.played_at < buckets.bucket_start + ${interval}::interval
    GROUP BY buckets.bucket_start
    ORDER BY buckets.bucket_start;
  `);

  return rows.map((row) => ({
    label: row.label,
    value: toNumber(row.value),
  }));
};

/**
 * @param get `/api/counts`
 * @description fetches the count of songs, albums, and playlists from the database
 */
router.get('/counts', async (req: Request, res: Response) => {
  try {
    const numSongs = await prisma.track.count();
    const numAlbums = await prisma.album.count();
    const numPlaylists = await prisma.playlist.count();

    res.json({ numSongs, numAlbums, numPlaylists });
  } catch (error) {
    console.error("Error fetching counts:", error);
    res.status(500).json({ error: "Failed to fetch counts" });
  }
});

router.get('/stats/summary', async (_req: Request, res: Response) => {
  try {
    const [numSongs, numAlbums, numPlaylists] = await Promise.all([
      prisma.track.count(),
      prisma.album.count(),
      prisma.playlist.count(),
    ]);

    res.json({ numSongs, numAlbums, numPlaylists });
  } catch (error) {
    console.error('Error fetching stats summary:', error);
    res.status(500).json({ error: 'Failed to fetch stats summary' });
  }
});

router.get('/stats/listens/day', async (_req: Request, res: Response) => {
  try {
    const data = await buildListenSeriesQuery('day', 14, 'Mon DD');
    res.json(data);
  } catch (error) {
    console.error('Error fetching daily listens:', error);
    res.status(500).json({ error: 'Failed to fetch daily listens' });
  }
});

router.get('/stats/listens/week', async (_req: Request, res: Response) => {
  try {
    const data = await buildListenSeriesQuery('week', 12, 'Mon DD');
    res.json(data);
  } catch (error) {
    console.error('Error fetching weekly listens:', error);
    res.status(500).json({ error: 'Failed to fetch weekly listens' });
  }
});

router.get('/stats/listens/month', async (_req: Request, res: Response) => {
  try {
    const data = await buildListenSeriesQuery('month', 12, 'Mon YYYY');
    res.json(data);
  } catch (error) {
    console.error('Error fetching monthly listens:', error);
    res.status(500).json({ error: 'Failed to fetch monthly listens' });
  }
});

router.get('/stats/genres', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.$queryRaw<GenreRow[]>(Prisma.sql`
      SELECT
        genre.name AS label,
        COUNT(track_genre.track_id)::int AS value
      FROM genres AS genre
      JOIN track_genre
        ON track_genre.genre_id = genre.genre_id
      GROUP BY genre.name
      HAVING COUNT(track_genre.track_id) > 0
      ORDER BY value DESC, genre.name ASC;
    `);

    res.json({
      uniqueGenres: rows.length,
      genres: rows.map((row) => ({
        label: row.label,
        value: toNumber(row.value),
      })),
    });
  } catch (error) {
    console.error('Error fetching genre stats:', error);
    res.status(500).json({ error: 'Failed to fetch genre stats' });
  }
});

router.get('/stats/listening-time', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.$queryRaw<TimeSeriesRow[]>(Prisma.sql`
      WITH buckets AS (
        SELECT generate_series(
          date_trunc('month', now()) - interval '11 month',
          date_trunc('month', now()),
          interval '1 month'
        ) AS bucket_start
      )
      SELECT
        to_char(buckets.bucket_start, 'Mon YYYY') AS label,
        ROUND(COALESCE(SUM(activity.duration_played), 0) / 60.0, 2) AS value
      FROM buckets
      LEFT JOIN user_activity AS activity
        ON activity.played_at >= buckets.bucket_start
       AND activity.played_at < buckets.bucket_start + interval '1 month'
      GROUP BY buckets.bucket_start
      ORDER BY buckets.bucket_start;
    `);

    res.json(rows.map((row) => ({
      label: row.label,
      value: toNumber(row.value),
    })));
  } catch (error) {
    console.error('Error fetching listening time trends:', error);
    res.status(500).json({ error: 'Failed to fetch listening time trends' });
  }
});

/**
 * @param get `/api/stats/top-tracks`
 * @description Returns the most-played tracks by listen count, for a succinct "top tracks" view
 * @queryParam `limit` - max number of tracks to return (default 5, max 20)
 */
router.get('/stats/top-tracks', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 20);

    const grouped = await prisma.activity.groupBy({
      by: ['track_id'],
      where: { track_id: { not: null } },
      _count: { activity_id: true },
      orderBy: { _count: { activity_id: 'desc' } },
      take: limit,
    });

    const trackIds = grouped
      .map((row) => row.track_id)
      .filter((id): id is number => id !== null);

    const tracks = await prisma.track.findMany({
      where: { track_id: { in: trackIds } },
      include: { album: true },
    });
    const trackById = new Map(tracks.map((track) => [track.track_id, track]));

    const topTracks = grouped
      .filter((row) => row.track_id !== null)
      .map((row) => {
        const track = trackById.get(row.track_id as number);
        return {
          track_id: row.track_id,
          title: track?.title ?? 'Unknown track',
          album_title: track?.album?.title ?? null,
          cover_art_url: track?.cover_art_url ?? track?.album?.cover_art_url ?? null,
          play_count: row._count.activity_id,
        };
      });

    res.json(topTracks);
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    res.status(500).json({ error: 'Failed to fetch top tracks' });
  }
});

router.get('/stats/date-uploaded', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.trackFile.groupBy({
      by: ['file_mtime'],
      _count: {
        track_id: true,
      },
      orderBy: {
        file_mtime: 'asc',
      },
    });

    // Roll up per-timestamp rows into per-day totals
    const byDay = new Map<string, number>();
    for (const row of rows) {
      const day = row.file_mtime.toISOString().split('T')[0];
      byDay.set(day, (byDay.get(day) ?? 0) + row._count.track_id);
    }

    res.json(
      Array.from(byDay.entries()).map(([date, count]) => ({ date, count })),
    );
  } catch (error) {
    console.error('Error fetching date uploaded stats:', error);
    res.status(500).json({ error: 'Failed to fetch date uploaded stats' });
  }
});

export default router;