import express from 'express';
import { Authenticate } from '../middleware/auth.middleware.js';
import { Authorize } from '../middleware/role.middleware.js';
import { createSchedule, searchSchedules } from '../controllers/schedule.controller.js';

const router = express.Router();

router.get("/search",Authenticate, Authorize("admin","user"),searchSchedules);
router.post("/",Authenticate, Authorize("admin"),createSchedule);

export default router;