import express from 'express';
import {protect,authorize} from '../controllers/middleware.js';
import{get_All_Birth_records ,get_My_birth_record,get_Selected_Birth_records,get_Birth_record_By_Id} from '../controllers/birth_records.js';
const router =express.Router();

router.get("/me",protect,get_My_birth_record);
router.get("/all",protect,authorize("admin"),get_All_Birth_records);
router.get("/select",protect,authorize("admin"),get_Selected_Birth_records);
router.get("/:id",protect,authorize("admin"),get_Birth_record_By_Id);

export default router;