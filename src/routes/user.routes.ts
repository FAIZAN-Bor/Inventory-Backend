import { Router } from 'express';
import { userController } from '../controllers';
import { authenticate } from '../middleware';

const router = Router();

// All routes are protected
router.use(authenticate);

// Get all users (controller checks for QASIM SEWING MACHINE)
router.get('/', userController.getUsers);

// Update user (controller checks for QASIM SEWING MACHINE)
router.put('/:id', userController.updateUser);

export default router;
