import express from 'express';
import {getMyInfo,getAllInfo,getPersonById,getSelectedUsers,getUserCount} from '../controllers/person.js';

import {protect,authorize} from '../controllers/middleware.js';

const router = express.Router();

router.get("/me",protect,getMyInfo);
router.get("/select",protect,authorize("admin"),getSelectedUsers);
router.get("/all",protect,authorize("admin"),getAllInfo);
router.get("/:id",protect,authorize("admin", "police"),getPersonById);
router.get("/count",protect,authorize("admin"),getUserCount);
export default router;