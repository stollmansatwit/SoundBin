import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/database';

const router = Router();

/**
 * Lists every genre in the library, alphabetically — used to populate the
 * genre picker in the track edit modal.
 * @param get `/api/genres`
 */
router.get('/genres', async (_req: Request, res: Response) => {
  try {
    const genres = await prisma.genre.findMany({
      select: { genre_id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

/**
 * Finds an existing genre by (case-insensitive) name, or creates a new
 * one — powers the "create a new genre" option in the track edit modal's
 * genre picker.
 * @param post `/api/genres`
 * @body { name: string }
 */
router.post('/genres', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Genre name is required' });
    }
    const trimmed = name.trim();

    let genre = await prisma.genre.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (!genre) {
      genre = await prisma.genre.create({ data: { name: trimmed } });
    }

    res.status(201).json(genre);
  } catch (error) {
    console.error('Error creating genre:', error);
    res.status(500).json({ error: 'Failed to create genre' });
  }
});

export default router;
