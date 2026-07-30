/**
 * @file Handles the Routes for file uploads
 * @module UploadRoutes
 * @author  Ian Mac
 * @version 0.2
 */
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { ingestTrackFile } from '../services/ingest';

const NUM_FILES = 200;

// Extend Request locally so fileFilter can record rejected files without `any`-casting everywhere.
interface UploadRequest extends Request {
  rejectedFiles?: string[];
}

const ALLOWED_EXTENSIONS = new Set(['.mp3', '.flac', '.wav', '.aac', '.ogg', '.m4a']);
const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/x-flac', 'audio/wav', 'audio/x-wav',
  'audio/aac', 'audio/x-aac', 'audio/ogg', 'application/ogg', 'audio/mp4', 'audio/x-m4a',
]);

function isAllowedFile(originalName: string, mimetype: string): boolean {
  const ext = path.extname(originalName).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIME_TYPES.has(mimetype);
}

/*
Saves file to path specified.

The on-disk filename is generated server-side (timestamp + random UUID),
never derived from the client-supplied original filename. The original
name previously had only \r\n stripped from it, which does nothing to
stop a crafted name like "../../../etc/whatever" from escaping the
upload directory via multer's path.join(destination, filename). The
real (human-readable) name isn't needed on disk anyway — the library
reads title/artist from embedded ID3/Vorbis tags, not the filename.
*/
const upload = multer({
  storage: multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      // This path should match your .env UPLOAD_DIR
      const BaseDir = process.env.DOCKER_SONG_FILE_LOCATION;
      const targetDir = `${BaseDir}/songs`;
      cb(null, targetDir);
    },
    filename: (req: any, file: any, cb: any) => {
      const ext = ALLOWED_EXTENSIONS.has(path.extname(file.originalname).toLowerCase())
        ? path.extname(file.originalname).toLowerCase()
        : '';
      cb(null, `${Date.now()}-${randomUUID()}${ext}`);
    },
  }),
  fileFilter: (req: UploadRequest, file, cb) => {
    // Reject unsupported files before anything is written to disk, rather
    // than saving them and only checking mimetype after the fact (which
    // also left orphaned invalid files sitting in the songs directory).
    // cb(null, false) skips just this file instead of aborting the whole
    // batch, so one bad file in a multi-file upload doesn't block the rest.
    if (!isAllowedFile(file.originalname, file.mimetype)) {
      req.rejectedFiles = req.rejectedFiles ?? [];
      req.rejectedFiles.push(file.originalname);
      return cb(null, false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: NUM_FILES, // matches the .array() cap below
  },
});

const router = express.Router();

/*
Posts to the route. Saves each valid file to disk, then synchronously
ingests it (metadata extraction + DB writes) via the same shared service
the file watcher uses, so the HTTP response reflects what's actually in
the library — not just what got written to disk. Previously the response
fired the instant multer finished saving, before the watcher had (async,
on its own multi-second timer) actually indexed anything.
*/
router.post('/upload', (req: UploadRequest, res: Response) => {
  upload.array('songFiles', NUM_FILES)(req, res, async (err: unknown) => {
    if (err) {
      const message = err instanceof multer.MulterError ? err.message : 'Upload failed';
      return res.status(400).json({ message });
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const rejected = req.rejectedFiles ?? [];

    if (files.length === 0) {
      return res.status(400).json({
        message: rejected.length > 0
          ? `No valid files were uploaded. Rejected: ${rejected.join(', ')}. Only mp3, flac, wav, aac, ogg, and m4a are allowed.`
          : 'No files were uploaded.',
      });
    }

    // Sequential, not Promise.all: ingesting a whole album at once is the
    // common case for a multi-file upload, and running those concurrently
    // would let multiple tracks race to create the same new Artist/Album/
    // Genre row (the find-or-create checks below aren't atomic, and there's
    // no DB-level unique constraint on album title+artist to catch it).
    const results: Array<{ originalName: string } & Awaited<ReturnType<typeof ingestTrackFile>>> = [];
    for (const file of files) {
      const result = await ingestTrackFile(file.path);
      results.push({ originalName: file.originalname, ...result });
    }

    const created = results.filter((r) => r.status === 'created').length;
    const duplicates = results.filter((r) => r.status === 'duplicate').length;
    const alreadyIndexed = results.filter((r) => r.status === 'exists').length;
    const errors = results.filter((r) => r.status === 'error').length;

    const anySuccess = results.length - errors > 0;
    const statusCode = errors > 0 && anySuccess ? 207 // partial success
      : errors > 0 && !anySuccess ? 500
      : 200;

    console.log(`${files.length} file(s) uploaded: ${created} indexed, ${duplicates} duplicate, ${alreadyIndexed} already indexed, ${errors} failed.`);

    res.status(statusCode).json({
      message: `${created} file(s) indexed${duplicates ? `, ${duplicates} duplicate(s) skipped` : ''}${alreadyIndexed ? `, ${alreadyIndexed} already in library` : ''}${errors ? `, ${errors} failed` : ''}.`,
      results,
      rejected, // files skipped for invalid type before ever reaching disk
    });
  });
});

/*
Cover-image upload for things that aren't tracks (playlist art, etc).
Stored the same way embedded/fetched artwork is: content-hashed filename
in the shared assets dir, served back out via the existing /assets
static route. Kept separate from the audio `upload` multer instance
above since the allowed types/limits are different.
*/
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post('/upload-image', (req: Request, res: Response) => {
  imageUpload.single('image')(req, res, async (err: unknown) => {
    if (err) {
      const message = err instanceof multer.MulterError ? err.message : 'Upload failed';
      return res.status(400).json({ message });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No image was uploaded, or the file type is unsupported.' });
    }

    try {
      const { createHash } = await import('crypto');
      const fs = await import('fs/promises');
      const path = await import('path');

      const BaseDir = process.env.DOCKER_SONG_FILE_LOCATION;
      const assetsDir = `${BaseDir}/assets`;
      await fs.mkdir(assetsDir, { recursive: true });

      const ext = file.mimetype.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
      const hash = createHash('sha256').update(file.buffer).digest('hex').slice(0, 16);
      const fileName = `${hash}.${ext}`;
      const outPath = path.join(assetsDir, fileName);

      try {
        await fs.access(outPath);
      } catch {
        await fs.writeFile(outPath, file.buffer);
      }

      res.json({ cover_art_url: outPath });
    } catch (error) {
      console.error('Error saving uploaded image:', error);
      res.status(500).json({ message: 'Failed to save image' });
    }
  });
});

export default router;