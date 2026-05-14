import express from 'express';
import { Authenticate } from '../middleware/auth.middleware.js';
import { Authorize } from '../middleware/role.middleware.js';
import { createRoute, getAllRoutes } from '../controllers/route.controller.js';

const router = express.Router();

router.get("/",Authenticate, Authorize("admin","user"),getAllRoutes);
router.post("/",Authenticate, Authorize("admin"),createRoute);

export default router;