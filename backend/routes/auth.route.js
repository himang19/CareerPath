import express from "express";
import { googleLogin, googleCallback, setRole } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/google", googleLogin); // Step 1
router.get("/google/callback", googleCallback); // Step 2
router.post("/set-role", setRole); // Step 3

export default router;
