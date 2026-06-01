import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

// Health check endpoint with DB connection test
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'connected' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ ok: false, db: 'disconnected' });
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
