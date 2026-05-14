import express from 'express';
import { Authenticate } from '../middleware/auth.middleware.js';
import { Authorize } from '../middleware/role.middleware.js';
import { getAvailableSeats } from '../controllers/seat.controller.js';
import { createBooking } from '../controllers/booking.controller.js';

const router = express.Router();

router.get("/available-seats/:scheduleId",getAvailableSeats);
router.post("/",Authenticate,createBooking);

export default router;