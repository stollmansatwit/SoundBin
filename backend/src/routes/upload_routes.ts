/**
 * @file desc
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

/*
Saves file to path specified
*/
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req:any, file:any, cb:any) => {
      // This path should match your .env UPLOAD_DIR
      cb(null, process.env.DOCKER_SONG_FILE_LOCATION || './uploads');  // Remove './uploads' after development
    },
    filename: (req:any, file:any, cb:any) => {
      cb(null, Date.now() + '-' + file.originalname);
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
router.post('/upload', upload.single('songFile'), (req: Request, res: Response) => {

  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/wav'];
  const fileType = req.file?.mimetype;

  if( !fileType || !allowedTypes.includes(fileType)) {
    return res.status(400).json({message: "Invalid file type. Only mp3, flac, and wav are allowed."})
  }

  console.log("File saved to disk by Multer");
  res.status(200).json({ message: "Upload successful" });
});

export default router;