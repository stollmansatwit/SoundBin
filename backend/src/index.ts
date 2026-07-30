import express from 'express';
import cors from 'cors';
import path from 'path';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import 'dotenv/config';
import bcrypt from 'bcryptjs';


// import functions
// import routes
import uploadRoutes from './routes/upload_routes';
import albumRoutes from './routes/album_routes'
import artistRoutes from './routes/artist_routes'
import trackRoutes from './routes/track_routes'
import statsRoutes from './routes/stats_routes'
import playlistRoutes from './routes/playlist_routes'
import genreRoutes from './routes/genre_routes'
import activityRoutes from './routes/activity_routes'
import userRoutes from './routes/user_routes'

import jwt from 'jsonwebtoken';
import { requireAuth, type AuthRequest } from './middleware/auth';

import { prisma } from "./lib/database";
import { PORT, ALLOWED_ORIGINS, ALLOWED_METHODS } from "./config";
import './services/watcher'

const app = express();
export { app }

const port = PORT;

type ColumnRow = {
  table_name: string;
  column_name: string;
  ordinal_position: number;
};

// Middleware
app.use(express.json());
app.use(cors({ origin: ALLOWED_ORIGINS,
              methods: ALLOWED_METHODS,
              allowedHeaders: ['Content-Type', 'Authorization'],
              credentials: true}));


app.use('/assets', express.static(path.join(process.cwd(), 'uploads', 'assets')));
app.use('/songs', express.static(path.join(process.cwd(), 'uploads', 'songs'), { // set expliced to allow for audio streaming
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    // No Access-Control-Allow-Origin here on purpose. The cors() middleware
    // above already ran and set it from ALLOWED_ORIGINS; setting it again
    // overwrote that with a hardcoded localhost:5173 and broke audio playback
    // on any other origin.

    if (filePath.endsWith('.mp3')) res.setHeader('Content-Type', 'audio/mpeg');
    if (filePath.endsWith('.flac')) res.setHeader('Content-Type', 'audio/flac');
    if (filePath.endsWith('.ogg')) res.setHeader('Content-Type', 'audio/ogg');
    
    // Crucial for media streaming: allow ranges
    res.setHeader('Accept-Ranges', 'bytes');
  }
}));


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
app.get('/schema/columns', async (_req: Request, res: Response) => {
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
app.use('/api', albumRoutes);
app.use('/api', artistRoutes);
app.use('/api', trackRoutes);
app.use('/api', statsRoutes);
app.use('/api', playlistRoutes);
app.use('/api', genreRoutes);
app.use('/api', activityRoutes);
app.use('/api', userRoutes);



// Search Database for songs, artists, albums, and playlists
/**
 * @param get `/api/search`
 * @description searches the database for songs, artists, albums, and playlists based on a query parameter
 * @queryParam `q` - The search query string
 * @returns JSON object containing search results for songs, artists, albums, and playlists
 */
app.get('/api/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query || query.trim().length < 1) {
    return res.json([]);
  }
  
  try {
    const songs = await prisma.track.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      select: { track_id: true, title: true, album_id: true },
    });

    const artists = await prisma.artist.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      select: { artist_id: true, name: true },
    });

    const albums = await prisma.album.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      select: { album_id: true, title: true, cover_art_url: true },
    });

    const playlists = await prisma.playlist.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      select: { playlist_id: true, name: true },
    });

    res.json([
      ...songs.map((song) => ({ type: 'song', id: song.track_id, name: song.title })),
      ...artists.map((artist) => ({ type: 'artist', id: artist.artist_id, name: artist.name })),
      ...albums.map((album) => ({ type: 'album', id: album.album_id, name: album.title })),
      ...playlists.map((playlist) => ({ type: 'playlist', id: playlist.playlist_id, name: playlist.name })),
    ]);
  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).json({ error: "Search failed" });
  }
});




app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
     return res.status(400).json({ error: "Username and password are required" });
   }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // The very first person to register becomes an admin and is auto-approved.
    // Everyone after that is created unapproved and must wait for an admin to approve them.
    const existingUserCount = await prisma.user.count();
    const isFirstUser = existingUserCount === 0;

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username: username,
        password_hash: hashedPassword,
        display_name: username, // Default display name to username
        is_admin: isFirstUser,
        is_approved: isFirstUser,
      },
    });

    res.status(201).json({
      message: isFirstUser
        ? "User registered successfully as the first admin"
        : "User registered successfully. An admin must approve your account before you can log in.",
      userId: newUser.user_id,
      requiresApproval: !isFirstUser,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});


// login endpoint needs to compare hashed password from the database with the password provided by the user. 
// Use bcrypt to compare the hashed password with a hashed version of the plain text password.


app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      select: {
        user_id: true,
        username: true,
        password_hash: true,
        is_active: true,
        is_approved: true,
      },
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "Account is inactive" });
    }

    if (!user.is_approved) {
      return res.status(403).json({ error: "Your account is awaiting admin approval" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { userId: user.user_id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    // Optionally update last_login
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { last_login: new Date() },
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
  }
});



// get /api/user endpoint to return the user info based on the token provided in the Authorization header
app.get('/api/user', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.userId },
      select: {
        user_id: true,
        username: true,
        display_name: true,
        is_active: true,
        is_admin: true,
        is_approved: true,
        register_date: true,
        last_login: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

// Server startup
app.listen(port, () => {
  console.log(`🎵 SoundBin backend listening on port ${port}`);
  console.log(`   Accepting browser requests from: ${ALLOWED_ORIGINS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
