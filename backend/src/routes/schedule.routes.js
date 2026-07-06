import express from 'express';
import { Authenticate } from '../middleware/auth.middleware.js';
import { Authorize } from '../middleware/role.middleware.js';
import {
  createSchedule,
  searchSchedules,
  listSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from '../controllers/schedule.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createScheduleSchema,
  searchSchedulesSchema,
  updateScheduleSchema,
} from '../validations/schedule.validation.js';

const router = express.Router();

// Public search (no auth required)
router.get("/search", searchSchedules);

// Admin: list / get / update / delete templates
router.get(
  "/",
  Authenticate,
  Authorize("admin"),
  listSchedules,
);

router.get(
  "/:id",
  Authenticate,
  Authorize("admin"),
  getScheduleById,
);

router.put(
  "/:id",
  Authenticate,
  Authorize("admin"),
  validate(updateScheduleSchema),
  updateSchedule,
);

router.delete(
  "/:id",
  Authenticate,
  Authorize("admin"),
  deleteSchedule,
);

router.post(
  "/",
  Authenticate,
  Authorize("admin"),
  validate(createScheduleSchema),
  createSchedule,
);

export default router;