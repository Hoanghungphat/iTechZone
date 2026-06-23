/**
 * src/modules/auth/auth.routes.js
 */
import { Router } from 'express'
import { handleValidation }        from '../../core/middlewares/validate.middleware.js'
import { protect }                 from '../../core/middlewares/auth.middleware.js'
import { registerRules, loginRules } from './auth.schema.js'
import {
  registerController,
  loginController,
  getMeController,
} from './auth.controller.js'

const router = Router()

// POST /api/auth/register
router.post('/register', registerRules, handleValidation, registerController)

// POST /api/auth/login
router.post('/login', loginRules, handleValidation, loginController)

// GET /api/auth/me  [protected]
router.get('/me', protect, getMeController)

export default router
