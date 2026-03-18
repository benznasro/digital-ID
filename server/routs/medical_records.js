import express from 'express';
import {protect,authorize} from '../controllers/middleware.js';
import {get_Medical_record_by_id,get_Selected_Medical_records,get_All_Medical_records,get_My_Medical_record,updateMedicalRecord} from '../controllers/medical_records.js';
const router = express.Router();

router.get("/me",protect,get_My_Medical_record);
router.get("/all",protect,authorize("admin"),get_All_Medical_records);
router.get("/select",protect,authorize("admin"),get_Selected_Medical_records);
router.post("/hospital/update_medical_record",protect,authorize("hospital"));
router.get("/:id",protect,authorize("admin"),get_Medical_record_by_id);

export default router;