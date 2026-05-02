import express from 'express';
import UserController from '../controllers/UserController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// GET /api/users (solo el rol Admin)
router.get('/', authenticate, authorize(['admin']), UserController.getAll);

// GET /api/users/me (cualquier usuario autenticado)
router.get('/me', authenticate, authorize([]), UserController.getMe);

// PUT /api/users/me (cualquier usuario autenticado)
router.put('/me', authenticate, authorize([]), UserController.updateMe);

// GET /api/users/:id (solo admin)
router.get('/:id', authenticate, authorize(['admin']), UserController.getById);

export default router;