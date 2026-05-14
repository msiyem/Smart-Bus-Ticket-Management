import express from 'express'
import {  registerUserController } from '../controllers/users.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema } from '../validations/user.validation.js';
import { login, logout, me, refresh } from '../controllers/auth.controller.js';
import { Authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET 
router
  .get('/me',Authenticate, me);

// POST
router
  .post('/register', validate(registerSchema), registerUserController)
  .post('/login', login)
  .post('/logout', logout)
  .post('/refresh', refresh);


export default router;