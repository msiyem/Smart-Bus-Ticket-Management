import express from 'express';
import { getAllUsersController,getUserProfileController} from '../controllers/users.controller.js';
import { Authenticate } from '../middleware/auth.middleware.js';
import { Authorize } from '../middleware/role.middleware.js';
const router = express.Router();

// GET all users
router.get('/', Authenticate,Authorize("admin"), getAllUsersController);

// GET user by ID
router.get('/:id', Authenticate, getUserProfileController);


export default router;