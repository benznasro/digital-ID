import express from 'express';
import {protect,authorize} from '../middleware.js';
import {create_Birth,update_Medical_Record,add_Death_Record} from './hospital_con.js';
const router = express.Router();

router.post("/birth",protect,authorize("hospital"),create_Birth);
router.patch("/update_medical_record",protect,authorize("hospital"),update_Medical_Record);
router.post("/addDeathRecord",protect,authorize("hospital"),add_Death_Record);


export default router;