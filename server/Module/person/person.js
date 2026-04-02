import express from 'express';
import {
	getMyInfo,
	getAllInfo,
	getPersonById,
	getPersonRelatedRecords,
	getSelectedUsers,
	getUserCount,
	searchPeopleForGovernment,
} from './person_con.js';

import {protect,authorize} from '../middleware.js';

const router = express.Router();

router.get("/me",protect,getMyInfo);
router.get("/select",protect,authorize("admin"),getSelectedUsers);
router.get("/all",protect,authorize("admin"),getAllInfo);
router.get("/count",protect,authorize("admin"),getUserCount);
router.get("/gov/search",protect,authorize("government", "admin"),searchPeopleForGovernment);
router.get("/:id/related",protect,authorize("admin", "police", "government"),getPersonRelatedRecords);




router.get("/:id",protect,authorize("admin", "police", "government"),getPersonById);

export default router;