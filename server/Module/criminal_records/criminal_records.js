import express from 'express';
import { protect, authorize } from '../middleware.js';
import {
  getCriminalRecordById,
  getMyCriminalRecords,
  getAllCriminalRecords,
  getSelectedCriminalRecords,
  createCriminalRecord,
  updateCriminalRecord,
} from './criminal_records_con.js';

const router = express.Router();

router.get('/me', protect, getMyCriminalRecords);
router.get('/all', protect, authorize('admin', 'police', 'government'), getAllCriminalRecords);
router.get('/select', protect, authorize('admin', 'police', 'government'), getSelectedCriminalRecords);
router.get('/:id', protect, authorize('admin', 'police', 'government'), getCriminalRecordById);

router.post('/create', protect, authorize('admin', 'police', 'government'), createCriminalRecord);
router.patch('/:id', protect, authorize('admin', 'police', 'government'), updateCriminalRecord);

export default router;
