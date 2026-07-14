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

// /me must come before /:id so :id doesn't capture "me".
router.get("/me", Authenticate, requireOperator, getMyOperator);

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