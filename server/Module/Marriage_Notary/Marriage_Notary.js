import express from 'express';
import {protect,authorize} from '../middleware.js';
import {new_Marriage} from './Marriage_Notary_con.js';
const router =express.Router();

router.post("/new_marriage",protect,authorize("Marriage_Notary"),new_Marriage);

export default router;