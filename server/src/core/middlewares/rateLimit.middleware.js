/**
 * src/core/middlewares/rateLimit.middleware.js
 * Rate limiting để chống DDoS và brute-force
 */
import rateLimit from 'express-rate-limit'

// ─── Helper tạo response chuẩn khi bị rate limit ──
const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message,
    retryAfter: Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000),
  })
}

// ─── 1. Giới hạn chung toàn bộ API ─────────────────
// 200 request / 15 phút / IP
export const generalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              200,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler: rateLimitHandler('Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.'),
})

// ─── 2. Auth — chống brute-force login/register ─────
// 10 request / 15 phút / IP
export const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true, // không đếm request thành công
  handler: rateLimitHandler('Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.'),
})

// ─── 3. Public routes (sản phẩm, banner) ────────────
// 300 request / 15 phút / IP — thoải mái hơn cho browser
export const publicLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             300,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: rateLimitHandler('Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.'),
})

// ─── 4. Order / Cart — chống spam đặt hàng ──────────
// 30 request / 15 phút / IP
export const orderLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: rateLimitHandler('Quá nhiều yêu cầu thanh toán. Vui lòng thử lại sau ít phút.'),
})
