/**
 * @file desc
 * @module UploadRoutes
 * @author  Ian Mac
 * @version 0.1
 */
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { app } from '../index';

// Configure storage
// Store in memory first to handle during pipeline? or diskStorage?
const storage = multer.memoryStorage(); 


const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // This path should match your .env UPLOAD_DIR
      cb(null, process.env.DOCKER_SONG_FILE_LOCATION || './uploads');  // Remove './uploads' after development
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  })
});

const router = express.Router();

router.post('/upload', upload.single('songFile'), (req: Request, res: Response) => {
  console.log("File saved to disk by Multer");
  res.status(200).json({ message: "Upload successful" });
});

export default router;