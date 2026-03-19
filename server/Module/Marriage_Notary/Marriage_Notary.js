import express from 'express';
import {protect,authorize} from '../middleware.js';
import {new_Marriage,Divorce} from './Marriage_Notary_con.js';
const router =express.Router();

router.post("/new_marriage",protect,authorize("Marriage_Notary"),new_Marriage);
router.patch('/divorce', protect, authorize('Marriage_Notary'), Divorce);

export default router;