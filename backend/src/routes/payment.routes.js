import express from 'express';
import { Authenticate } from '../middleware/auth.middleware.js';
import { Authorize } from '../middleware/role.middleware.js';
import { createPayment } from '../controllers/payment.controller.js';
const router = express.Router();

router.post("/",Authenticate, createPayment);

export default router;