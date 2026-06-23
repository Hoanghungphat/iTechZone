/**
 * src/modules/auth/auth.controller.js
 */
import { register, login, getMe, requestPasswordReset } from './auth.service.js'
import { successResponse } from '../../core/utils/response.js'

export async function registerController(req, res, next) {
  try {
    const { name, email, phone, password } = req.body
    const result = await register({ name, email, phone, password })
    return successResponse(res, result, 'Đăng ký thành công', 201)
  } catch (err) { next(err) }
}

export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body
    const result = await login({ email, password })
    return successResponse(res, result, 'Đăng nhập thành công')
  } catch (err) { next(err) }
}

export async function getMeController(req, res, next) {
  try {
    const user = await getMe(req.user.id)
    return successResponse(res, user)
  } catch (err) { next(err) }
}

export async function forgotPasswordController(req, res, next) {
  try {
    const { email } = req.body
    const result = await requestPasswordReset(email)
    return successResponse(res, { remainMs: 0 }, result.message)
  } catch (err) {
    // Trả về remainMs để frontend hiện đếm ngược
    if (err.statusCode === 429) {
      return res.status(429).json({ success: false, message: err.message, remainMs: err.remainMs })
    }
    next(err)
  }
}
