/**
 * src/modules/auth/auth.service.js
 * Business logic: đăng ký, đăng nhập, lấy thông tin user
 */
import bcrypt   from 'bcryptjs'
import jwt      from 'jsonwebtoken'
import prisma   from '../../configs/database.js'

const SALT_ROUNDS = 12
const JWT_SECRET  = process.env.JWT_SECRET || 'itechzone_secret_key'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'

// ================================
// HELPERS
// ================================
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

function safeUser(user) {
  const { password, ...safe } = user
  return safe
}

// ================================
// REGISTER
// ================================
export async function register({ name, email, phone, password }) {
  // Kiểm tra email đã tồn tại chưa
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const err = new Error('Email đã được sử dụng')
    err.statusCode = 409
    throw err
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)

  const user = await prisma.user.create({
    data: { name, email, phone, password: hashed },
  })

  const token = generateToken({ id: user.id, email: user.email, role: user.role })

  return { user: safeUser(user), token }
}

// ================================
// LOGIN
// ================================
export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    const err = new Error('Email hoặc mật khẩu không đúng')
    err.statusCode = 401
    throw err
  }

  if (!user.isActive) {
    const err = new Error('Tài khoản đã bị khoá. Vui lòng liên hệ hỗ trợ.')
    err.statusCode = 403
    throw err
  }

  const matched = await bcrypt.compare(password, user.password)
  if (!matched) {
    const err = new Error('Email hoặc mật khẩu không đúng')
    err.statusCode = 401
    throw err
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role })

  return { user: safeUser(user), token }
}

// ================================
// GET ME
// ================================
export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: { where: { isDefault: true }, take: 1 },
      _count:    { select: { orders: true, reviews: true } },
    },
  })
  if (!user) {
    const err = new Error('Không tìm thấy người dùng')
    err.statusCode = 404
    throw err
  }
  return safeUser(user)
}

// ================================
// REQUEST PASSWORD RESET (quên MK → gửi yêu cầu lên admin)
// ================================
const COOLDOWN_MS = 15 * 60 * 1000 // 15 phút

export async function requestPasswordReset(email) {
  // 1. Kiểm tra email tồn tại
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.role !== 'user') {
    const err = new Error('Không tìm thấy tài khoản với email này')
    err.statusCode = 404
    throw err
  }

  // 2. Kiểm tra cooldown 15 phút
  const recent = await prisma.passwordResetRequest.findFirst({
    where: {
      userId: user.id,
      createdAt: { gte: new Date(Date.now() - COOLDOWN_MS) },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (recent) {
    const remainMs  = COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())
    const remainMin = Math.ceil(remainMs / 60000)
    const err = new Error(`Bạn đã gửi yêu cầu rồi. Vui lòng chờ thêm ${remainMin} phút.`)
    err.statusCode = 429
    err.remainMs   = remainMs
    throw err
  }

  // 3. Tạo yêu cầu mới
  await prisma.passwordResetRequest.create({ data: { userId: user.id } })
  return { message: 'Yêu cầu đã được ghi nhận. Nhân viên sẽ liên hệ qua số điện thoại sớm nhất.' }
}
