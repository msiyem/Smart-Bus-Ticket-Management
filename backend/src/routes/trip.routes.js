import express from "express";
import { Authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  listTrips,
  getTripById,
  updateTrip,
  cancelTrip,
  deleteTrip,
} from "../controllers/trip.controller.js";
import { requireOperator, requireOperatorOwnership } from "../middleware/operator.middleware.js";
import {
  listTripsQuerySchema,
  updateTripSchema,
  cancelTripSchema,
} from "../validations/trip.validation.js";

const router = express.Router();

// Admin + Operator (operator scoped via requireOperator + ownership).
router.get(
  "/",
  Authenticate,
  requireOperator,
  listTrips,
);
router.get(
  "/:id",
  Authenticate,
  requireOperator,
  requireOperatorOwnership("trip"),
  getTripById,
);
router.put(
  "/:id",
  Authenticate,
  requireOperator,
  requireOperatorOwnership("trip"),
  validate(updateTripSchema),
  updateTrip,
);
router.post(
  "/:id/cancel",
  Authenticate,
  requireOperator,
  requireOperatorOwnership("trip"),
  validate(cancelTripSchema),
  cancelTrip,
);
router.delete(
  "/:id",
  Authenticate,
  requireOperator,
  requireOperatorOwnership("trip"),
  deleteTrip,
);

export default router;