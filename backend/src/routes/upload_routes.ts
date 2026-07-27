/**
 * @file Handles the Routes for file uploads
 * @module UploadRoutes
 * @author  Ian Mac
 * @version 0.1
 */
import express, { Request, Response } from 'express';
import multer from 'multer';
import { app } from '../index';

// Configure storage
// Store in memory first to handle during pipeline? or diskStorage?
const storage = multer.memoryStorage(); 

// Cleans string name for storage by removing bad characters 
function cleanName(fileName: string){
  const cleanName = fileName.replace(/[\r\n]/g, '');
  return cleanName
}

/*
Saves file to path specified
*/
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req:any, file:any, cb:any) => {
      // This path should match your .env UPLOAD_DIR
      const BaseDir = process.env.DOCKER_SONG_FILE_LOCATION;
      const targetDir = `${BaseDir}/songs`;
      cb(null, targetDir);
    },
    filename: (req:any, file:any, cb:any) => {
      const cleanFile = cleanName(file.originalname);
      cb(null, Date.now() + '-' + cleanFile);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

const router = express.Router();

/*
Posts to the route, checks the file type to return response
*/
router.post('/upload', upload.array('songFiles', 20), (req: Request, res: Response) => {

  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/wav'];
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files were uploaded." });
  }

  const invalidFiles = files.filter((file) => !allowedTypes.includes(file.mimetype));

  if (invalidFiles.length > 0) {
    const invalidNames = invalidFiles.map((file) => file.originalname).join(', ');
    return res.status(400).json({
      message: `Invalid file type for: ${invalidNames}. Only mp3, flac, and wav are allowed.`,
    });
  }

  console.log(`${files.length} file(s) saved to disk by Multer`);
  res.status(200).json({ message: "Upload successful", count: files.length });
});

export default router;