import express from 'express';
import {protect,authorize} from '../middleware.js';
import {new_Marriage,Divorce,get_My_AuditLogs,get_my_marriage} from './Marriage_con.js';
const router =express.Router();

router.post("/new_marriage",protect,authorize("Marriage_Notary"),new_Marriage);
router.patch('/divorce', protect, authorize('Marriage_Notary'), Divorce);
router.get('/my_logs', protect, authorize('Marriage_Notary'), get_My_AuditLogs);
router.get('/me', protect, get_my_marriage);
export default router;