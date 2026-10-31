import { Router } from 'express';
import * as AuthController from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

// Public authentication routes
router.post('/signup', authRateLimiter, AuthController.signup);
router.post('/register', authRateLimiter, AuthController.register); // alias
router.post('/login', authRateLimiter, AuthController.login);
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword);

// Session endpoints
router.get('/me', authenticate, AuthController.getMe);
router.post('/logout', AuthController.logout);

export default router;
