import express from 'express';
import { protect, authorize } from '../middleware.js';
import { uploadPersonPhoto, getMyPhoto, getPhotoByPersonId } from './person_photos_con.js';

const router = express.Router();

router.post('/upload', protect, uploadPersonPhoto);
router.get('/me', protect, getMyPhoto);
router.get('/person/:personId', protect, authorize('admin', 'government', 'police', 'hospital'), getPhotoByPersonId);

export default router;
