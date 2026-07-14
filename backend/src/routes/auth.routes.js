import express from "express";
import { registerUserController } from "../controllers/users.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerSchema, loginSchema } from "../validations/user.validation.js";
import {
  googleLoginSchema,
  logoutSchema,
} from "../validations/auth.validation.js";
import {
  login,
  logout,
  me,
  googleLogin,
} from "../controllers/auth.controller.js";
import { Authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", Authenticate, me);

router
  .post("/register", validate(registerSchema), registerUserController)
  .post("/login", validate(loginSchema), login)
  .post("/google", validate(googleLoginSchema), googleLogin)
  .post("/logout", validate(logoutSchema), logout);

export default router;