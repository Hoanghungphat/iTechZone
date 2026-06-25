/**
 * src/modules/admin/admin.controller.js
 */
import * as svc from './admin.service.js'
import { successResponse } from '../../core/utils/response.js'
import { generateAccessToken } from '../auth/auth.service.js'
import bcrypt from 'bcryptjs'
import prisma from '../../configs/database.js'

// ---- Auth ----
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !['admin', 'staff'].includes(user.role))
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc không có quyền' })
    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khoá' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ success: false, message: 'Mật khẩu không đúng' })

    const token = generateAccessToken({ id: user.id, email: user.email, role: user.role })
    return successResponse(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    }, 'Đăng nhập thành công')
  } catch (err) { next(err) }
}

// ---- Dashboard ----
export async function dashboard(req, res, next) {
  try { return successResponse(res, await svc.getDashboardStats()) } catch (e) { next(e) }
}

// ---- Products ----
export async function listProducts(req, res, next) {
  try {
    const { page = 1, limit = 20, search, category, status } = req.query
    return successResponse(res, await svc.getAllProducts({ page: +page, limit: +limit, search, category, status }))
  } catch (e) { next(e) }
}
export async function addProduct(req, res, next) {
  try { return successResponse(res, await svc.createProduct(req.body), 'Thêm sản phẩm thành công', 201) } catch (e) { next(e) }
}
export async function editProduct(req, res, next) {
  try { return successResponse(res, await svc.updateProduct(req.params.id, req.body), 'Cập nhật sản phẩm thành công') } catch (e) { next(e) }
}
export async function removeProduct(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      await svc.deleteProductAdmin(req.params.id)
      return successResponse(res, null, 'Đã xoá sản phẩm')
    }
    // Staff → tạo approval request
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
    const request = await svc.createRequest({ type: 'DELETE_PRODUCT', targetId: req.params.id, targetName: product.name, note: req.body.note, requestedById: req.user.id })
    return successResponse(res, request, 'Đã gửi yêu cầu xoá sản phẩm, chờ Admin duyệt', 202)
  } catch (e) { next(e) }
}

// ---- Users ----
export async function listUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, search, role } = req.query
    return successResponse(res, await svc.getAllUsers({ page: +page, limit: +limit, search, role }))
  } catch (e) { next(e) }
}
export async function editUser(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      return successResponse(res, await svc.updateUser(req.params.id, req.body), 'Cập nhật người dùng thành công')
    }
    // Staff → tạo approval request
    const target = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!target) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })
    const request = await svc.createRequest({ type: 'EDIT_USER', targetId: req.params.id, targetName: target.name, note: req.body.note, payload: req.body.payload, requestedById: req.user.id })
    return successResponse(res, request, 'Đã gửi yêu cầu chỉnh sửa, chờ Admin duyệt', 202)
  } catch (e) { next(e) }
}
export async function toggleUser(req, res, next) {
  try { return successResponse(res, await svc.toggleUserActive(req.params.id), 'Cập nhật trạng thái tài khoản') } catch (e) { next(e) }
}
export async function removeUser(req, res, next) {
  try { await svc.deleteUser(req.params.id); return successResponse(res, null, 'Đã xoá người dùng') } catch (e) { next(e) }
}
export async function resetUserPassword(req, res, next) {
  try {
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải ít nhất 6 ký tự' })

    const target = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!target) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })

    if (req.user.role === 'admin') {
      // Admin → đổi mật khẩu trực tiếp
      const hashed = await bcrypt.hash(newPassword, 10)
      await prisma.user.update({ where: { id: req.params.id }, data: { password: hashed } })
      return successResponse(res, null, 'Đã đổi mật khẩu thành công')
    }

    // Staff → tạo approval request
    const request = await svc.createRequest({
      type: 'RESET_PASSWORD',
      targetId: req.params.id,
      targetName: target.name,
      note: req.body.note || 'Reset mật khẩu theo yêu cầu khách hàng',
      payload: { newPassword },
      requestedById: req.user.id,
    })
    return successResponse(res, request, 'Đã gửi yêu cầu reset mật khẩu, chờ Admin duyệt', 202)
  } catch (e) { next(e) }
}

// ---- Staff ----
export async function listStaff(req, res, next) {
  try { return successResponse(res, await svc.getAllUsers({ role: 'staff', limit: 100, page: 1 })) } catch (e) { next(e) }
}
export async function addStaff(req, res, next) {
  try { return successResponse(res, await svc.createStaff(req.body), 'Tạo tài khoản nhân viên thành công', 201) } catch (e) { next(e) }
}
export async function removeStaff(req, res, next) {
  try { await svc.deleteUser(req.params.id); return successResponse(res, null, 'Đã xoá nhân viên') } catch (e) { next(e) }
}

// ---- Orders ----
export async function listOrders(req, res, next) {
  try {
    const { page = 1, limit = 20, status, search } = req.query
    return successResponse(res, await svc.getAllOrders({ page: +page, limit: +limit, status, search }))
  } catch (e) { next(e) }
}
export async function changeOrderStatus(req, res, next) {
  try {
    const { status, version } = req.body
    const actor = { id: req.user.id, name: req.user.name, role: req.user.role }
    return successResponse(res, await svc.updateOrderStatus(req.params.id, status, version, actor), 'Cập nhật trạng thái đơn hàng')
  } catch (e) { next(e) }
}

// ---- Requests ----
export async function listRequests(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query
    return successResponse(res, await svc.getRequests({ page: +page, limit: +limit, status }))
  } catch (e) { next(e) }
}
export async function approve(req, res, next) {
  try { return successResponse(res, await svc.approveRequest(req.params.id, req.user.id, req.body.reviewNote), 'Đã duyệt yêu cầu') } catch (e) { next(e) }
}
export async function reject(req, res, next) {
  try { return successResponse(res, await svc.rejectRequest(req.params.id, req.user.id, req.body.reviewNote), 'Đã từ chối yêu cầu') } catch (e) { next(e) }
}

// ---- Activity Logs ----
export async function listLogs(req, res, next) {
  try {
    const { page = 1, limit = 30, userId, action } = req.query
    return successResponse(res, await svc.getLogs({ page: +page, limit: +limit, userId, action }))
  } catch (e) { next(e) }
}

// ---- Password Reset Requests ----
export async function listPasswordResets(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    return successResponse(res, await svc.listPasswordResetRequests({ status, page: +page, limit: +limit }))
  } catch (e) { next(e) }
}

export async function completePasswordReset(req, res, next) {
  try {
    const { tempPassword } = req.body
    return successResponse(res, await svc.completePasswordReset(req.params.id, tempPassword, req.user.id))
  } catch (e) { next(e) }
}

export async function cancelPasswordReset(req, res, next) {
  try {
    return successResponse(res, await svc.cancelPasswordReset(req.params.id, req.user.id))
  } catch (e) { next(e) }
}

export async function listStaffPasswordResets(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query
    return successResponse(res, await svc.listStaffPasswordResets({ page: +page, limit: +limit }))
  } catch (e) { next(e) }
}

// ---- Reviews ----
export async function deleteReview(req, res, next) {
  try {
    const { id } = req.params
    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' })

    await prisma.review.delete({ where: { id } })

    // Cập nhật lại rating trung bình sản phẩm
    const { _avg } = await prisma.review.aggregate({
      where: { productId: review.productId },
      _avg:  { rating: true },
    })
    await prisma.product.update({
      where: { id: review.productId },
      data:  { rating: Math.round((_avg.rating ?? 0) * 10) / 10 },
    })

    return successResponse(res, null, 'Đã xoá đánh giá')
  } catch (e) { next(e) }
}
