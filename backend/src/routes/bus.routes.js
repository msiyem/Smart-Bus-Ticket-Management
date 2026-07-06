import express from "express";
import { Authenticate } from "../middleware/auth.middleware.js";
import { Authorize } from "../middleware/role.middleware.js";
import { createBus, getAllBuses } from "../controllers/bus.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { createBusSchema } from "../validations/bus.validation.js";

const router = express.Router();

router.get("/", Authenticate, Authorize("admin"), getAllBuses);
router.post(
  "/",
  Authenticate,
  Authorize("admin"),
  validate(createBusSchema),
  createBus,
);

export default router;
