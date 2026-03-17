import express from 'express';
import {getMyInfo,getAllInfo,getPersonById,getSelectedUsers,getUserCount,createBirth} from '../controllers/person.js';

import {protect,authorize} from '../controllers/middleware.js';

const router = express.Router();

router.get("/me",protect,getMyInfo);
router.get("/select",protect,authorize("admin"),getSelectedUsers);
router.get("/all",protect,authorize("admin"),getAllInfo);
router.get("/count",protect,authorize("admin"),getUserCount);


router.post("/hospital/birth",protect,authorize("hospital"),createBirth);

router.get("/:id",protect,authorize("admin", "police"),getPersonById);

export default router;