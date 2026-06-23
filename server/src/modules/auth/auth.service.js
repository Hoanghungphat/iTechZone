/**
 * src/modules/auth/auth.service.js
 */
import bcrypt from 'bcryptjs'
import jwt    from 'jsonwebtoken'
import prisma from '../../configs/database.js'
import { sendVerifyEmail, sendForgotPasswordEmail } from '../../core/email.js'

const SALT_ROUNDS = 12
const JWT_SECRET  = process.env.JWT_SECRET || 'itechzone_secret_key'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'
const OTP_TTL_MS  = 5 * 60 * 1000 // 5 phút

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}
function safeUser(user) {
  const { password, ...safe } = user
  return safe
}
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// ================================
// REGISTER (gửi OTP xác minh email)
// ================================
export async function register({ name, email, phone, password }) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const err = new Error('Email đã được sử dụng')
    err.statusCode = 409
    throw err
  }
  const hashed = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: { name, email, phone, password: hashed, isVerified: false },
  })
  const otp = generateOtp()
  await prisma.otpToken.create({
    data: { email, code: otp, type: 'verify_email', expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  })
  await sendVerifyEmail(email, otp)
  return { message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.', email }
}

// ================================
// VERIFY EMAIL
// ================================
export async function verifyEmail({ email, otp }) {
  const token = await prisma.otpToken.findFirst({
    where: { email, code: otp, type: 'verify_email', used: false, expiresAt: { gt: new Date() } },
  })
  if (!token) {
    const err = new Error('Mã OTP không hợp lệ hoặc đã hết hạn')
    err.statusCode = 400
    throw err
  }
  await prisma.otpToken.update({ where: { id: token.id }, data: { used: true } })
  const user = await prisma.user.update({ where: { email }, data: { isVerified: true } })
  const jwtToken = generateToken({ id: user.id, email: user.email, role: user.role })
  return { user: safeUser(user), token: jwtToken }
}

// ================================
// RESEND VERIFY OTP
// ================================
export async function resendVerifyOtp(email) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { const e = new Error('Email không tồn tại'); e.statusCode = 404; throw e }
  if (user.isVerified) { const e = new Error('Tài khoản đã được xác minh'); e.statusCode = 400; throw e }
  await prisma.otpToken.deleteMany({ where: { email, type: 'verify_email' } })
  const otp = generateOtp()
  await prisma.otpToken.create({
    data: { email, code: otp, type: 'verify_email', expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  })
  await sendVerifyEmail(email, otp)
  return { message: 'Đã gửi lại mã OTP' }
}

// ================================
// LOGIN (kiểm tra isVerified)
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
  if (!user.isVerified) {
    const err = new Error('Tài khoản chưa được xác minh email. Vui lòng kiểm tra hộp thư.')
    err.statusCode = 403
    err.code = 'EMAIL_NOT_VERIFIED'
    err.email = email
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
// FORGOT PASSWORD — gửi OTP
// ================================
export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { const e = new Error('Email không tồn tại trong hệ thống'); e.statusCode = 404; throw e }
  await prisma.otpToken.deleteMany({ where: { email, type: 'forgot_password' } })
  const otp = generateOtp()
  await prisma.otpToken.create({
    data: { email, code: otp, type: 'forgot_password', expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  })
  await sendForgotPasswordEmail(email, otp)
  return { message: 'Đã gửi mã OTP về email' }
}

// ================================
// VERIFY FORGOT OTP
// ================================
export async function verifyForgotOtp({ email, otp }) {
  const token = await prisma.otpToken.findFirst({
    where: { email, code: otp, type: 'forgot_password', used: false, expiresAt: { gt: new Date() } },
  })
  if (!token) {
    const err = new Error('Mã OTP không hợp lệ hoặc đã hết hạn')
    err.statusCode = 400
    throw err
  }
  return { message: 'OTP hợp lệ', valid: true }
}

// ================================
// RESET PASSWORD
// ================================
export async function resetPassword({ email, otp, newPassword }) {
  const token = await prisma.otpToken.findFirst({
    where: { email, code: otp, type: 'forgot_password', used: false, expiresAt: { gt: new Date() } },
  })
  if (!token) {
    const err = new Error('Mã OTP không hợp lệ hoặc đã hết hạn')
    err.statusCode = 400
    throw err
  }
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS)
  await prisma.user.update({ where: { email }, data: { password: hashed } })
  await prisma.otpToken.update({ where: { id: token.id }, data: { used: true } })
  return { message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.' }
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
