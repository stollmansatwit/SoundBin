# 🎵 SoundBin - Self-Hosted Music Library

A self-hosted music library with data transparency, seamless setup, and simplicity in mind. Control your music, create playlists, and stream from anywhere!

**Created by Ian MacDougall and Sammy Stollman**

## 📋 Project Overview

SoundBin gives control back to the user and allows them to create convenient playlists. It uses user data while maintaining complete privacy to automatically generate playlists and present listening statistics. The application runs in a Docker container, allowing deployment on a home server, VPS, or locally on a single machine.

**Target Audience:** Privacy-conscious listeners who own a personal music collection and want to replace subscription services with a self-hosted alternative.

### Project Goals
- Easy to install
- Fast performance
- Database backend (PostgreSQL)
- Clean, user-friendly UI
- Quick search
- Playlist generation
- Listening statistics

## 🏗️ Architecture

### Tech Stack

**Backend:**
- **Node.js & Express** - REST API framework with streaming support
- **TypeScript** - Type-safe development
- **Prisma ORM** - Database management and migrations
- **PostgreSQL** - Relational database for metadata and user data

**Frontend:**
- **React** - Component-based UI
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe frontend code

**Orchestration:**
- **Docker & Docker Compose** - Containerization and orchestration

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Hardware capable of running Docker

### One-Command Startup (Assuming Docker is running)

```bash
cd /path/to/SoundBin
docker compose up
```

This single command starts:
- **PostgreSQL 16** on port 5433 (soundbin_postgres-data volume for persistence)
- **Backend API** on port 3000 (auto-runs migrations on startup)
- **Frontend** on port 5173 with hot-reload support

### Access the Application

Open browser and navigate to: **http://localhost:5173**

If you see the following in your terminal, everything has been created correctly:

[+] up 4/4\
 ✔ Network soundbin_default    &nbsp;&nbsp;&emsp; <span style="color:green">Created</span>&emsp;                                                  0.3s\
 ✔ Container soundbin-db       &nbsp;&nbsp;&emsp;&emsp;&emsp;<span style="color:green">Created</span>&emsp;                                                  0.0s\
 ✔ Container soundbin-backend  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:green">Created</span>&emsp;                                                  2.1s\
 ✔ Container soundbin-frontend &nbsp;&nbsp;&nbsp;<span style="color:green">Created</span>&emsp;                                                  1.8s\
Attaching to soundbin-backend, soundbin-db, soundbin-frontend\
Container soundbin-db Waiting 

You should see a home page with links to registration and login.\
You must register as a user before you can use the application for authentication. 
### Local Development (without Docker)

If you prefer to run locally for development:

**Backend:**
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev  # Runs on http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

**Database:**
```bash
# Make sure PostgreSQL is running on port 5433
# Update DATABASE_URL in backend/.env as needed
```

## 📁 Project Structure

```
SoundBin/
├── backend/
│   ├── src/
│   │   ├── routes/        # REST endpoints, one file per resource
│   │   ├── services/      # ingest.ts, watcher.ts, artwork.ts
│   │   ├── middleware/     # auth, etc.
│   │   ├── controllers/
│   │   ├── lib/           # database.ts, activity.ts
│   │   └── utils/         # metadata.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/          # route-level views
│   │   ├── components/     # buttons, library, playback, popUpPage, scrollable
│   │   ├── audio/          # AudioEngine.ts
│   │   ├── context/        # AudioContext, PopupContext
│   │   ├── hooks/          # useAudioEngine
│   │   └── config.ts
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🗄️ Database Schema

### Core Models

- **User** - Account, auth, and profile info
- **UserFavorite** - Join table for a user's favorited tracks
- **UserTag** - User-created tags on tracks
- **Activity** - Play history / listening log, used for statistics
- **Track** - Individual songs
- **TrackFile** - Audio file metadata (bitrate, codec, storage path); supports multiple files per track
- **TrackContributor** - Credits an artist's role on a track (join table, Track ↔ Artist)
- **TrackGenre** - Join table, Track ↔ Genre
- **Genre** - Genre metadata
- **Lyrics** - Per-track, per-language lyrics
- **Artist** - Music artist information
- **Album** - Album metadata
- **AlbumTrackSequence** - Defines track order within an album
- **Playlist** - User-created playlists
- **PlaylistItem** - Ordered track membership in a playlist

## 🔧 Environment Variables

**Backend (.env):**
```
PORT=3000
DATABASE_URL="postgresql://soundbin:soundbin_dev@localhost:5433/soundbin?schema=public"
```

## 📝 Development Workflow

### Backend Development

```bash
cd backend
npm run dev      # Start with hot-reload
npm run build    # Build TypeScript
npm run start    # Run production build
```

### Frontend Development

```bash
cd frontend
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Database

```bash
cd backend
npx prisma studio          # Open Prisma Studio (visual editor)
npx prisma migrate dev     # Create new migration
npx prisma db push        # Sync schema with database
```

## 🐳 Docker

### Start All Services

```bash
docker compose up -d
```

### Stop Services

```bash
docker compose down
```

### View Logs

```bash
docker compose logs -f db
```

## 🧪 Testing the API

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{"ok":true,"db":"connected"}
```

## 🔄 CORS Configuration

The backend allows requests from the frontend on `http://localhost:5173`. To change this, update `backend/src/index.ts`.

### 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check backend and database status |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in and receive a JWT |
| GET | `/api/user` | Get current user's info |
| PATCH | `/api/user` | Update current user's info |
| PATCH | `/api/user/password` | Change current user's password |
| GET | `/api/admin/users` | List all users (admin only) |
| PATCH | `/api/admin/users/:userId/approve` | Approve a pending user (admin only) |
| PATCH | `/api/admin/users/:userId/admin` | Grant/revoke admin status (admin only) |
| DELETE | `/api/admin/users/:userId` | Delete a user (admin only) |
| GET | `/api/search` | Search across the library |
| POST | `/api/upload` | Upload an audio file |
| POST | `/api/upload-image` | Upload a cover/artwork image |
| GET | `/api/tracks` | List all tracks |
| GET | `/api/tracks/:trackId` | Get a single track |
| PATCH | `/api/tracks/:trackId` | Edit track metadata |
| GET | `/api/album/:id` | Get a single album |
| PATCH | `/api/albums/:id` | Edit an album |
| DELETE | `/api/albums/:id` | Delete an album |
| GET | `/api/artists` | List all artists |
| POST | `/api/artists` | Create an artist |
| PATCH | `/api/artists/:id` | Edit an artist |
| GET | `/api/genres` | List all genres |
| POST | `/api/genres` | Create a genre |
| GET | `/api/playlists` | List all playlists |
| POST | `/api/playlists` | Create a playlist |
| GET | `/api/playlist/:id` | Get a single playlist |
| PATCH | `/api/playlists/:id` | Edit a playlist |
| DELETE | `/api/playlists/:id` | Delete a playlist |
| POST | `/api/playlist-items` | Add a track to a playlist |
| DELETE | `/api/playlist-items` | Remove a track from a playlist |
| POST | `/api/activity` | Log a listening event |
| GET | `/api/activity/recent` | Get recent listening activity |
| GET | `/api/stats/summary` | Get overall listening stats summary |
| GET | `/api/stats/top-tracks` | Get most-played tracks |
| GET | `/api/stats/genres` | Get listening stats by genre |

## 🐳 Docker Compose Commands

```bash
# Start all services in background
docker compose up -d

# Start services and follow logs
docker compose up

# Stop all services
docker compose down

# View logs for a specific service
docker compose logs -f backend    # Backend logs
docker compose logs -f frontend   # Frontend logs
docker compose logs -f db         # Database logs

# Restart a service
docker compose restart backend

# Rebuild images and restart
docker compose up -d --build
```

## 🔧 Troubleshooting

**Port already in use:**
- If port 5433 (database), 3000 (backend), or 5173 (frontend) is already in use, update the port mappings in `docker-compose.yml`

**Backend not connecting to database:**
- Check backend logs: `docker compose logs backend`
- Verify database is healthy: `docker compose logs db`
- Ensure `DATABASE_URL` is correct in `.env`

**Frontend not connecting to backend:**
- Check frontend logs: `docker compose logs frontend`
- Verify backend is running: `curl http://localhost:3000/api/health`
- Clear browser cache and hard-refresh (Ctrl+Shift+R)

**Database permission issues:**
- Volume must have proper permissions: `sudo chown 999:999 -R postgres-data` (on Linux)

**Rebuild everything from scratch:**
```bash
docker compose down
docker image rm soundbin-backend soundbin-frontend
docker compose up -d --build
```

## 🎯 Next Steps


1. **Statistics Improvements**
   - Deeper listening insights (e.g. top genres over time, trends by day/week)
   - More detailed per-artist and per-album breakdowns

2. **Recommendation Queue**
   - Suggest tracks based on listening history and favorites
   - Surface recommendations directly in the queue, not just the library

3. **Playlist Generation**
   - Auto-generate playlists from listening history (e.g. "most played," "recently discovered")
   - Move beyond manual, user-created playlists to smart/dynamic ones

4. **Settings Page with Customization**
   - User-level preferences (theme, default view, playback behavior)
   - Centralize account and app settings currently scattered across the UI

## 📄 License

This project is developed as part of a university senior project.

## 🙏 Acknowledgments

Inspired by projects like Navidrome, Funkwhale, and Subsonic. Uses APIs MusicBrainz and Deezer.

## Important References
https://medium.com/@yelee2369/node-js-streaming-audio-files-10dd5e8670d0

https://www.youtube.com/watch?v=x4bom6Udk_4

https://prismic.io/blog/tailwind-animations

https://stackoverflow.com/questions/79429572/whenever-i-run-my-react-vite-it-says-pluginviteesbuild-the-service-is-no-lon/79430130#79430130

https://www.reddit.com/r/reactjs/comments/1ddbqei/open_source_react_chart_libraries/

https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction
