import express from "express";
import { Authenticate } from "../middleware/auth.middleware.js";
import { Authorize } from "../middleware/role.middleware.js";
import { createBus, getAllBuses } from "../controllers/bus.controller.js";

const router = express.Router();

router.get("/", Authenticate, Authorize("admin"), getAllBuses);
router.post("/", Authenticate, Authorize("admin"), createBus);

export default router;
