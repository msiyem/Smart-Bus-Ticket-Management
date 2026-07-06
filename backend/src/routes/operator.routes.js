import express from "express";
import { Authenticate } from "../middleware/auth.middleware.js";
import { Authorize } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createOperator,
  getMyOperator,
  listOperators,
  getOperatorById,
  updateOperator,
  deleteOperator,
  getOperatorBuses,
  getOperatorSchedules,
} from "../controllers/operator.controller.js";
import {
  createOperatorSchema,
  updateOperatorSchema,
} from "../validations/operator.validation.js";
import { requireOperator } from "../middleware/operator.middleware.js";

const router = express.Router();

// Operator self (must run before /:id to avoid :id capturing "me")
router.get("/me", Authenticate, requireOperator, getMyOperator);

// Admin
router.post(
  "/",
  Authenticate,
  Authorize("admin"),
  validate(createOperatorSchema),
  createOperator,
);
router.get("/", Authenticate, Authorize("admin"), listOperators);
router.get(
  "/:id/buses",
  Authenticate,
  Authorize("admin"),
  getOperatorBuses,
);
router.get(
  "/:id/schedules",
  Authenticate,
  Authorize("admin"),
  getOperatorSchedules,
);
router.get("/:id", Authenticate, Authorize("admin"), getOperatorById);
router.put(
  "/:id",
  Authenticate,
  Authorize("admin"),
  validate(updateOperatorSchema),
  updateOperator,
);
router.delete("/:id", Authenticate, Authorize("admin"), deleteOperator);

export default router;
