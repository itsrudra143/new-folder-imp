import express from 'express';
import { getProfile, updateProfile, getCurrentUser } from '../controllers/users.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get current user
router.get('/me', authenticate, getCurrentUser);

// Get user profile
router.get('/profile', authenticate, getProfile);

// Update user profile
router.put('/profile', authenticate, updateProfile);

export default router; 