# 🎵 SoundBin - Self-Hosted Music Library

A self-hosted music library with data transparency, seamless setup, and simplicity in mind. Control your music, create playlists, and stream from anywhere!

**Created by Ian MacDougall and Sammy Stollman**

## 📋 Project Overview

SoundBin gives control back to the user and allows them to create convenient playlists. It uses user data while maintaining complete privacy to automatically generate playlists and present listening statistics. The application runs in a Docker container, allowing deployment on a home server, VPS, or locally on a single machine.

**Target Audience:** Privacy-conscious listeners who own a personal music collection and want to replace subscription services with a self-hosted alternative.

### Project Goals
- ✅ Easy to install
- ✅ Fast performance
- ✅ Database backend (PostgreSQL)
- ✅ Clean, user-friendly UI
- 🚧 Quick search with filters
- 🚧 Playlist generation
- 🚧 Listening statistics

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

**Infrastructure:**
- **Docker & Docker Compose** - Containerization and orchestration

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed

### One-Command Startup

```bash
cd /path/to/SoundBin
docker compose up
```

That's it! This single command starts:
- **PostgreSQL 16** on port 5433 (soundbin_postgres-data volume for persistence)
- **Backend API** on port 3000 (auto-runs migrations on startup)
- **Frontend** on port 5173 with hot-reload support

### Access the Application

Open your browser and navigate to: **http://localhost:5173**

You should see:
```
🎵 SoundBin
{ "ok": true, "db": "connected" }
```

This confirms all services are running and connected!

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
├── backend/                 # Express.js backend
│   ├── src/
│   │   └── index.ts        # Main server file
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Database migrations
│   ├── .env                # Environment variables
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx        # Main app component
│   │   └── index.css      # Global styles
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml      # Docker services
└── README.md
```

## 🗄️ Database Schema

### Core Models

- **User** - User authentication and profile
- **Artist** - Music artist information
- **Album** - Album metadata
- **Track** - Individual songs with file information
- **Playlist** - User-created playlists
- **PlaylistTrack** - Many-to-many junction between playlists and tracks
- **PlayEvent** - User listening history for statistics

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

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check backend and database status |

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

1. **Implement Authentication**
   - User registration and login endpoints
   - JWT token generation
   - Protected routes

2. **Audio File Upload**
   - File upload endpoints
   - Metadata extraction from ID3 tags
   - File storage management

3. **Audio Streaming**
   - Streaming endpoint with HTTP Range support
   - Playback controls

4. **Library Management**
   - Library scanner to detect files
   - Metadata enrichment
   - Search functionality

5. **Statistics & Playlists**
   - Track listening events
   - Generate statistics dashboard
   - Auto-generate playlists from history

6. **Frontend Features**
   - User dashboard
   - Library browser
   - Playlist management
   - Audio player UI

## 📄 License

This project is developed as part of a university senior project.

## 🙏 Acknowledgments

Inspired by projects like Navidrome, Funkwhale, and Subsonic.

## Important References
https://medium.com/@yelee2369/node-js-streaming-audio-files-10dd5e8670d0

https://www.youtube.com/watch?v=x4bom6Udk_4

https://prismic.io/blog/tailwind-animations

https://stackoverflow.com/questions/79429572/whenever-i-run-my-react-vite-it-says-pluginviteesbuild-the-service-is-no-lon/79430130#79430130

https://www.reddit.com/r/reactjs/comments/1ddbqei/open_source_react_chart_libraries/
