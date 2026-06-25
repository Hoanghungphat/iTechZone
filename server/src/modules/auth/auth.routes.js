/**
 * src/modules/auth/auth.routes.js
 */
import { Router } from 'express'
import { handleValidation }            from '../../core/middlewares/validate.middleware.js'
import { protect }                     from '../../core/middlewares/auth.middleware.js'
import { registerRules, loginRules }   from './auth.schema.js'
import {
  registerController,
  loginController,
  getMeController,
  refreshController,
  logoutController,
  forgotPasswordController,
} from './auth.controller.js'

const router = Router()

router.post('/register',         registerRules, handleValidation, registerController)
router.post('/login',            loginRules,    handleValidation, loginController)
router.get ('/me',               protect,                         getMeController)
router.post('/refresh',                                           refreshController)
router.post('/logout',                                            logoutController)
router.post('/forgot-password',                                   forgotPasswordController)

export default router
