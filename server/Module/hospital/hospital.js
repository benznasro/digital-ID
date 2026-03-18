import express from 'express';
import {protect,authorize} from '../middleware.js';
import {create_Birth,update_Medical_Record} from './hospital_con.js';

router.post("/birth",protect,authorize("hospital"),create_Birth);
router.post("/update_medical_record",protect,authorize("hospital"),update_Medical_Record);

const router = express.Router();


export default router;