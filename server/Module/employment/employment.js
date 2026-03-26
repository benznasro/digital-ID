import express from 'express';
import { protect, authorize } from '../middleware.js';
import {
  getEmploymentById,
  getMyEmployment,
  getAllEmployment,
  getSelectedEmployment,
  createEmployment,
  updateEmployment,
} from './employment_con.js';

const router = express.Router();

router.get('/me', protect, getMyEmployment);
router.get('/all', protect, authorize('admin', 'government'), getAllEmployment);
router.get('/select', protect, authorize('admin', 'government'), getSelectedEmployment);
router.get('/:id', protect, authorize('admin', 'government'), getEmploymentById);

router.post('/create', protect, authorize('admin', 'government'), createEmployment);
router.patch('/:id', protect, authorize('admin', 'government'), updateEmployment);

export default router;
