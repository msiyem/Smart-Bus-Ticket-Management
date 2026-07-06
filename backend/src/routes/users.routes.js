import express from 'express';
import { getAllUsersController, getUserProfileController, adminCreateUserController } from '../controllers/users.controller.js';
import { Authenticate } from '../middleware/auth.middleware.js';
import { Authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createUserAdminSchema } from '../validations/user.validation.js';
const router = express.Router();

// Admin: create a user with a specified role
router.post('/', Authenticate, Authorize("admin"), validate(createUserAdminSchema), adminCreateUserController);

// GET all users
router.get('/', Authenticate, Authorize("admin"), getAllUsersController);

// GET user by ID
router.get('/:id', Authenticate, getUserProfileController);


export default router;