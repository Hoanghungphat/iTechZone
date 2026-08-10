/**
 * src/app.js — Cấu hình Express app
 */
import express from 'express'
import cors    from 'cors'
import morgan  from 'morgan'
import cookieParser from 'cookie-parser'

import productRoutes              from './modules/product/product.routes.js'
import authRoutes                 from './modules/auth/auth.routes.js'
import userRoutes                 from './modules/user/user.routes.js'
import cartRoutes                 from './modules/cart/cart.routes.js'
import orderRoutes                from './modules/order/order.routes.js'
import adminRoutes                from './modules/admin/admin.routes.js'
import { productReviewRouter, reviewRouter } from './modules/review/review.routes.js'
import { bannerPublicRouter, bannerAdminRouter } from './modules/banner/banner.routes.js'
import { errorHandler, notFound } from './core/middlewares/error.middleware.js'
import { seedSystemAccounts, seedDefaultBanners } from './modules/admin/admin.service.js'

const app = express()

// ================================
// MIDDLEWARES
// ================================
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'https://itechzone.store',
      'https://www.itechzone.store',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ].filter(Boolean)

    const isVercel = origin?.endsWith('.vercel.app')

    if (allowedOrigins.includes(origin) || isVercel) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,   // ← bắt buộc để cookie cross-origin hoạt động
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Seed admin & staff accounts từ .env
seedSystemAccounts().catch(console.error)
// Seed banner mặc định nếu DB trống
seedDefaultBanners().catch(console.error)

// ================================
// ROUTES
// ================================
app.get('/', (req, res) => {
  res.json({
    message:   '🚀 ITechZone API',
    version:   '2.0.0',
    endpoints: {
      auth:     '/api/auth',
      users:    '/api/users',
      products: '/api/products',
      cart:     '/api/cart',
      orders:   '/api/orders',
      reviews:  '/api/products/:id/reviews',
    },
  })
})

// Health check — dùng cho UptimeRobot ping giữ Render không ngủ
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth',                        authRoutes)
app.use('/api/users',                       userRoutes)
app.use('/api/products',                    productRoutes)
app.use('/api/products/:productId/reviews', productReviewRouter)
app.use('/api/cart',                        cartRoutes)
app.use('/api/orders',                      orderRoutes)
app.use('/api/reviews',                     reviewRouter)
app.use('/api/banners',                     bannerPublicRouter)
app.use('/api/admin',                       adminRoutes)
app.use('/api/admin/banners',               bannerAdminRouter)

// ================================
// ERROR HANDLING
// ================================
app.use(notFound)
app.use(errorHandler)

export default app
