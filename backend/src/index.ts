import express from 'express';
import cors from 'cors';
import path from 'path';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import 'dotenv/config';
// import functions
// import routes
import uploadRoutes from './routes/upload_routes';
import ablumRoutes from './routes/album_routes'

import { prisma } from "./lib/database";
import './services/watcher'

const app = express();
export { app }

const port = Number(process.env.PORT);

type ColumnRow = {
  table_name: string;
  column_name: string;
  ordinal_position: number;
};

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://127.0.0.1:5173' }));

app.use('/assets', express.static(path.join(process.cwd(), 'uploads', 'assets')));


// Health check endpoint with DB connection test
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'connected' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ ok: false, db: 'disconnected' });
  }
});
// Endpoint to get schema columns
app.get('/api/schema/columns', async (_req: Request, res: Response) => {
  try {
    const rows: ColumnRow[] = await prisma.$queryRaw<ColumnRow[]>(Prisma.sql`
      SELECT
        table_name,
        column_name,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

    const tables = rows.reduce<Record<string, string[]>>(
      (accumulator: Record<string, string[]>, row: ColumnRow) => {
        if (!accumulator[row.table_name]) {
          accumulator[row.table_name] = [];
        }

        accumulator[row.table_name].push(row.column_name);
        return accumulator;
      },
      {},
    );

    res.json({
      tables: Object.entries(tables).map(([tableName, columns]) => ({
        tableName,
        columns,
      })),
    });
  }
  catch (error) {
    console.error('Schema query error:', error);
    res.status(500).json({ ok: false, error: 'Unable to load schema columns' });
  }
});

/**
 * API routes
 */

// API response for uploading single file
app.use('/api', uploadRoutes);
// Grabs the album photos
app.use('/api', ablumRoutes);


// // Get album cover art URLs TODO: Replace with code that grabs cover_art_url from public.album table. Do this after upload works
// app.get('/api/album-links', async (_req: Request, res: Response) => {
//   try {
//     const albums = await prisma.album.$queryRaw<{ cover_art_url: string }[]>(Prisma.sql`
//       SELECT cover_art_url FROM album
//     `);

//     res.json({ albums });
//   } catch (error) {
//     console.error('Album query error:', error);
//     res.status(500).json({ ok: false, error: 'Unable to load album links' });
//   }
// });
// TODO: User Authentication Endpoints


// Search Database for songs, artists, albums, and playlists
app.get('/api/search', async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ ok: false, error: 'Query parameter is required and must be a string' });
  }

  try {
    const searchResults = await prisma.$queryRaw(Prisma.sql`
      SELECT * FROM (
        SELECT 'song' AS type, id, title AS name FROM song WHERE title LIKE ${`%${query}%`}
        UNION ALL
        SELECT 'artist' AS type, id, name FROM artist WHERE name LIKE ${`%${query}%`}
        UNION ALL
        SELECT 'album' AS type, id, title AS name FROM album WHERE title LIKE ${`%${query}%`}
        UNION ALL
        SELECT 'playlist' AS type, id, name FROM playlist WHERE name LIKE ${`%${query}%`}
      ) AS combined_results
    `);

    res.json({ ok: true, results: searchResults });
  }
  catch (error) {
    console.error('Search query error:', error);
    res.status(500).json({ ok: false, error: 'Unable to perform search' });
  }
});


// Server startup
app.listen(port, () => {
  console.log(`🎵 SoundBin backend listening on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
