import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
    getUsers,
    updateProfile
} from "../controllers/userController.js";

const router = express.Router();

// GET USERS
router.get("/", protect, getUsers);

// UPDATE PROFILE
router.put("/profile", protect, upload.single("avatar"), updateProfile);

export default router;
