import express from 'express'
import {  registerUserController } from '../controllers/users.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validations/user.validation.js';
import { refreshSchema, logoutSchema } from '../validations/auth.validation.js';
import { login, logout, me, refresh } from '../controllers/auth.controller.js';
import { Authenticate } from '../middleware/auth.middleware.js';
const router = express.Router();

// GET
router
  .get('/me',Authenticate, me);

// POST
router
  .post('/register', validate(registerSchema), registerUserController)
  .post('/login', validate(loginSchema), login)
  .post('/logout', validate(logoutSchema), logout)
  .post('/refresh', validate(refreshSchema), refresh);


export default router;