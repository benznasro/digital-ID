import express from 'express';
import {getMyInfo,getAllInfo,getPersonById} from '../controllers/person.js';

import {protect,authorize} from '../controllers/middleware.js';

const router = express.Router();

router.get("/me",protect,getMyInfo);
router.get("/all",protect,authorize("admin"),getAllInfo);
router.get("/:id",protect,authorize("admin", "police"),getPersonById);
export default router;