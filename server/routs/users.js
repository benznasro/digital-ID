import express from 'express';
import { getUserCount } from '../countrols/users.js';
const router = express.Router();


router.get("/count", getUserCount );

export default router;