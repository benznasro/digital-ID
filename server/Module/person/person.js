import express from 'express';
import {getMyInfo,getAllInfo,getPersonById,getSelectedUsers,getUserCount} from './person_con.js';

import {protect,authorize} from '../middleware.js';

const router = express.Router();

router.get("/me",protect,getMyInfo);
router.get("/select",protect,authorize("admin"),getSelectedUsers);
router.get("/all",protect,authorize("admin"),getAllInfo);
router.get("/count",protect,authorize("admin"),getUserCount);




router.get("/:id",protect,authorize("admin", "police"),getPersonById);

export default router;