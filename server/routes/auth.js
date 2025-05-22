import express from 'express';
import { register, login } from '../controllers/auth.js';

const router = express.Router();

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

export default router; 