import express from 'express';
import { protect, authorize } from '../middleware.js';
import {
  getCriminalRecordById,
  getMyCriminalRecords,
  getMyCriminalAuditLogs,
  getAllCriminalRecords,
  getSelectedCriminalRecords,
  getSelectedCriminalAuditLogs,
  createCriminalRecord,
  updateCriminalRecord,
} from './criminal_records_con.js';

const router = express.Router();

router.get('/me', protect, getMyCriminalRecords);
router.get('/my_logs', protect, authorize('admin', 'police', 'government'), getMyCriminalAuditLogs);
router.get('/all', protect, authorize('admin', 'police', 'government'), getAllCriminalRecords);
router.get('/select', protect, authorize('admin', 'police', 'government'), getSelectedCriminalRecords);
router.get('/logs/select', protect, authorize('admin', 'police', 'government'), getSelectedCriminalAuditLogs);
router.get('/:id', protect, authorize('admin', 'police', 'government'), getCriminalRecordById);

router.post('/create', protect, authorize('admin', 'police', 'government'), createCriminalRecord);
router.patch('/:id', protect, authorize('admin', 'police', 'government'), updateCriminalRecord);

export default router;
