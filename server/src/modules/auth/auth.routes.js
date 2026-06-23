/**
 * src/modules/auth/auth.routes.js
 */
import { Router } from 'express'
import { handleValidation }          from '../../core/middlewares/validate.middleware.js'
import { protect }                   from '../../core/middlewares/auth.middleware.js'
import { registerRules, loginRules } from './auth.schema.js'
import {
  registerController,
  loginController,
  getMeController,
  verifyEmailController,
  resendVerifyOtpController,
  forgotPasswordController,
  verifyForgotOtpController,
  resetPasswordController,
} from './auth.controller.js'

const router = Router()

// POST /api/auth/register
router.post('/register', registerRules, handleValidation, registerController)

// POST /api/auth/login
router.post('/login', loginRules, handleValidation, loginController)

// GET /api/auth/me  [protected]
router.get('/me', protect, getMeController)

// POST /api/auth/verify-email
router.post('/verify-email', verifyEmailController)

// POST /api/auth/resend-verify-otp
router.post('/resend-verify-otp', resendVerifyOtpController)

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordController)

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyForgotOtpController)

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordController)

export default router
