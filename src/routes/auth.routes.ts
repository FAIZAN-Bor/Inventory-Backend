// Auth routes

import { Router } from 'express';
import { authController } from '../controllers';
import { validateBody } from '../middleware';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators';

const router = Router();

// Login
router.post('/login', validateBody(loginSchema), authController.login);

// Register - DISABLED (fixed users only)
// Registration is disabled. Use the fixed users created via Supabase Dashboard.
router.post('/register', (_req, res) => {
    res.status(403).json({
        success: false,
        message: 'Registration is disabled. Please contact the administrator.'
    });
});

// Forgot password
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);

// Reset password
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

export default router;
