import express from 'express';
import { Authenticate } from '../middleware/auth.middleware.js';
import { createPayment } from '../controllers/payment.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPaymentSchema } from '../validations/payment.validation.js';
const router = express.Router();

router.post("/", Authenticate, validate(createPaymentSchema), createPayment);

export default router;