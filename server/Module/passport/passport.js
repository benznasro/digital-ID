import express from 'express';
import { protect, authorize } from '../middleware.js';
import {
  getPassportById,
  getMyPassports,
  getAllPassports,
  getSelectedPassports,
  issuePassport,
  deactivatePassport,
} from './passport_con.js';

const router = express.Router();

router.get('/me', protect, getMyPassports);
router.get('/all', protect, authorize('admin', 'government', 'police'), getAllPassports);
router.get('/select', protect, authorize('admin', 'government', 'police'), getSelectedPassports);
router.get('/:id', protect, authorize('admin', 'government', 'police'), getPassportById);

router.post('/issue', protect, authorize('admin', 'government'), issuePassport);
router.patch('/deactivate/:id', protect, authorize('admin', 'government'), deactivatePassport);

export default router;
