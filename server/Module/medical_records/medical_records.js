import express from 'express';
import {protect,authorize} from '../middleware.js';
import {get_Medical_record_by_id,get_Selected_Medical_records,get_All_Medical_records,get_My_Medical_record} from './medical_records_con.js';

const router = express.Router();

router.get("/me",protect,get_My_Medical_record);
router.get("/all",protect,authorize("admin"),get_All_Medical_records);
router.get("/select",protect,authorize("admin"),get_Selected_Medical_records);

router.get("/:id",protect,authorize("admin"),get_Medical_record_by_id);

export default router;