import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

const port: number = process.env.PORT || 3000;

type ColumnRow = {
  table_name: string;
  column_name: string;
  ordinal_position: number;
};

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://127.0.0.1:5173' }));

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



// Server startup
app.listen(port, () => {
  console.log(`🎵 SoundBin backend listening on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
