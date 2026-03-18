import express from 'express';
import {protect,authorize} from '../middleware.js';
import{get_All_Birth_records ,get_My_birth_record,get_Selected_Birth_records,get_Birth_record_By_Id} from './birth_records_con.js';
const router =express.Router();

router.get("/me",protect,get_My_birth_record);
router.get("/all",protect,authorize("admin"),get_All_Birth_records);
router.get("/select",protect,authorize("admin"),get_Selected_Birth_records);
router.get("/:id",protect,authorize("admin"),get_Birth_record_By_Id);

export default router;