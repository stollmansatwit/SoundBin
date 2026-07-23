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
app.use(cors({ origin: ['http://127.0.0.1:5173', 'http://localhost:5173'], 
              methods: ['GET', 'POST', 'PUT', 'DELETE'], 
              allowedHeaders: ['Content-Type', 'Authorization'],
              credentials: true}));


app.use('/assets', express.static(path.join(process.cwd(), 'uploads', 'assets')));
app.use('/songs', express.static(path.join(process.cwd(), 'uploads', 'songs'), { // set expliced to allow for audio streaming
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');

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



app.get('/api/tracks', async (req: Request, res: Response) => {
  try {
    const tracks = await prisma.track.findMany({
      select: {
        track_id: true,
        title: true,
      },
    });

    res.json(tracks);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});


app.post('api/auth/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username: username,
        password_hash: hashedPassword,
      },
    });

    res.status(201).json({ message: "User registered successfully", userId: newUser.user_id });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});




// login endpoint needs to compare hashed password from the database with the password provided by the user. 
// Use bcrypt to compare the hashed password with a hashed version of the plain text password.
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      select: {
        username: true,
        password_hash: true, // Assuming the password is stored as a hashed value in the database
      },
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // If we reach here, the user is authenticated
    res.json({ message: "Login successful" });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
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
