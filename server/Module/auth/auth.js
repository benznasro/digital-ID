import express from "express";
import { login } from "./auth_con.js";
import {refresh,logout,protect} from "../middleware.js";

const router = express.Router();

router.post("/login", login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);

export default router;