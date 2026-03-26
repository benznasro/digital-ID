import express from 'express';
import { protect, authorize } from '../middleware.js';
import {
  getAssetById,
  getMyAssets,
  getAllAssets,
  getSelectedAssets,
  createAsset,
  updateAsset,
} from './assets_con.js';

const router = express.Router();

router.get('/me', protect, getMyAssets);
router.get('/all', protect, authorize('admin', 'government'), getAllAssets);
router.get('/select', protect, authorize('admin', 'government'), getSelectedAssets);
router.get('/:id', protect, authorize('admin', 'government'), getAssetById);

router.post('/create', protect, authorize('admin', 'government'), createAsset);
router.patch('/:id', protect, authorize('admin', 'government'), updateAsset);

export default router;
