import express from 'express';
import { Authenticate } from '../middleware/auth.middleware.js';
import { Authorize } from '../middleware/role.middleware.js';
import { createRoute, getAllRoutes } from '../controllers/route.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createRouteSchema } from '../validations/route.validation.js';

const router = express.Router();

router.get("/",getAllRoutes);
router.post("/",Authenticate, Authorize("admin"), validate(createRouteSchema), createRoute);

export default router;