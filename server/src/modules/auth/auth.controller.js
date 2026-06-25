/**
 * src/modules/auth/auth.controller.js
 */
import { register, login, getMe, requestPasswordReset, refreshAccessToken } from './auth.service.js'
import { successResponse } from '../../core/utils/response.js'

// Cookie options cho refresh token
const REFRESH_COOKIE_OPTS = {
  httpOnly:  true,
  sameSite:  'None',
  secure:    process.env.NODE_ENV === 'production',
  maxAge:    7 * 24 * 60 * 60 * 1000, // 7 ngày (ms)
  path:      '/',
}

export async function registerController(req, res, next) {
  try {
    const { name, email, phone, password, rememberMe } = req.body
    const result = await register({ name, email, phone, password })

    if (rememberMe) {
      res.cookie('itechzone_refresh', result.refreshToken, REFRESH_COOKIE_OPTS)
    }

    return successResponse(res, { user: result.user, token: result.token }, 'Đăng ký thành công', 201)
  } catch (err) { next(err) }
}

export async function loginController(req, res, next) {
  try {
    const { email, password, rememberMe } = req.body
    const result = await login({ email, password })

    if (rememberMe) {
      res.cookie('itechzone_refresh', result.refreshToken, REFRESH_COOKIE_OPTS)
    }

    return successResponse(res, { user: result.user, token: result.token }, 'Đăng nhập thành công')
  } catch (err) { next(err) }
}

export async function getMeController(req, res, next) {
  try {
    const user = await getMe(req.user.id)
    return successResponse(res, user)
  } catch (err) { next(err) }
}

export async function refreshController(req, res, next) {
  try {
    const refreshToken = req.cookies?.itechzone_refresh
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Không có refresh token' })
    }
    const result = await refreshAccessToken(refreshToken)
    return successResponse(res, result, 'Làm mới token thành công')
  } catch (err) { next(err) }
}

export async function logoutController(req, res, next) {
  try {
    res.clearCookie('itechzone_refresh', { path: '/', sameSite: 'None', secure: process.env.NODE_ENV === 'production' })
    return successResponse(res, null, 'Đã đăng xuất')
  } catch (err) { next(err) }
}

export async function forgotPasswordController(req, res, next) {
  try {
    const { email } = req.body
    const result = await requestPasswordReset(email)
    return successResponse(res, { remainMs: 0 }, result.message)
  } catch (err) {
    if (err.statusCode === 429) {
      return res.status(429).json({ success: false, message: err.message, remainMs: err.remainMs })
    }
    next(err)
  }
}
