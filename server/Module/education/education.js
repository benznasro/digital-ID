import express from 'express';
import { protect, authorize } from '../middleware.js';
import {
  getEducationById,
  getMyEducation,
  getAllEducation,
  getSelectedEducation,
  createEducation,
  updateEducation,
} from './education_con.js';

const router = express.Router();

router.get('/me', protect, getMyEducation);
router.get('/all', protect, authorize('admin', 'government'), getAllEducation);
router.get('/select', protect, authorize('admin', 'government'), getSelectedEducation);
router.get('/:id', protect, authorize('admin', 'government'), getEducationById);

router.post('/create', protect, authorize('admin', 'government'), createEducation);
router.patch('/:id', protect, authorize('admin', 'government'), updateEducation);

export default router;
