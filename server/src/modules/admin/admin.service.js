/**
 * src/modules/admin/admin.service.js
 * Business logic cho Admin Panel
 */
import bcrypt from 'bcryptjs'
import prisma from '../../configs/database.js'

// ================================
// SEED ADMIN & STAFF
// ================================
export async function seedSystemAccounts() {
  const accounts = [
    { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, name: process.env.ADMIN_NAME, role: 'admin' },
    { email: process.env.STAFF_EMAIL, password: process.env.STAFF_PASSWORD, name: process.env.STAFF_NAME, role: 'staff' },
  ]
  for (const acc of accounts) {
    if (!acc.email || !acc.password) continue
    const exists = await prisma.user.findUnique({ where: { email: acc.email } })
    if (!exists) {
      const hashed = await bcrypt.hash(acc.password, 10)
      await prisma.user.create({ data: { name: acc.name, email: acc.email, password: hashed, role: acc.role } })
      console.log(`   ✔ Seeded ${acc.role}: ${acc.email}`)
    }
  }
}

// ================================
// DASHBOARD
// ================================
export async function getDashboardStats() {
  const [totalProducts, totalUsers, totalOrders, totalRevenue, pendingRequests, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({ where: { role: 'user' } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { not: 'cancelled' } } }),
    prisma.approvalRequest.count({ where: { status: 'pending' } }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } }),
  ])
  return {
    totalProducts, totalUsers, totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    pendingRequests, recentOrders,
  }
}

// ================================
// PRODUCTS (Admin + Staff)
// ================================
export async function getAllProducts({ page = 1, limit = 20, search, category, status }) {
  const where = {}
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { brand: { contains: search, mode: 'insensitive' } }]
  if (category) where.category = category
  if (status) where.status = status

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ])
  return { products, total, page, totalPages: Math.ceil(total / limit) }
}

export async function createProduct(data) {
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
  return prisma.product.create({ data: { ...data, slug } })
}

export async function updateProduct(id, data) {
  return prisma.product.update({ where: { id }, data })
}

export async function deleteProductAdmin(id) {
  return prisma.product.delete({ where: { id } })
}

// ================================
// USERS (Admin only)
// ================================
export async function getAllUsers({ page = 1, limit = 20, search, role }) {
  const where = {}
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }]
  if (role) where.role = role

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true } }),
    prisma.user.count({ where }),
  ])
  return { users, total, page, totalPages: Math.ceil(total / limit) }
}

export async function updateUser(id, data) {
  const allowed = { name: data.name, phone: data.phone, isActive: data.isActive }
  Object.keys(allowed).forEach(k => allowed[k] === undefined && delete allowed[k])
  return prisma.user.update({ where: { id }, data: allowed, select: { id: true, name: true, email: true, phone: true, role: true, isActive: true } })
}

export async function toggleUserActive(id) {
  const user = await prisma.user.findUnique({ where: { id } })
  return prisma.user.update({ where: { id }, data: { isActive: !user.isActive } })
}

export async function deleteUser(id) {
  return prisma.user.delete({ where: { id } })
}

// ================================
// STAFF (Admin only)
// ================================
export async function createStaff({ name, email, password }) {
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) { const e = new Error('Email đã tồn tại'); e.statusCode = 400; throw e }
  const hashed = await bcrypt.hash(password, 10)
  return prisma.user.create({ data: { name, email, password: hashed, role: 'staff' }, select: { id: true, name: true, email: true, role: true } })
}

// ================================
// ORDERS (Admin + Staff)
// ================================
export async function getAllOrders({ page = 1, limit = 20, status, search }) {
  const where = {}
  if (status) where.status = status
  if (search) where.OR = [{ shippingName: { contains: search, mode: 'insensitive' } }, { shippingPhone: { contains: search } }]

  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } }, items: true } }),
    prisma.order.count({ where }),
  ])
  return { orders, total, page, totalPages: Math.ceil(total / limit) }
}

export async function updateOrderStatus(id, status) {
  // Nếu huỷ đơn → hoàn lại stock và sold cho từng sản phẩm
  if (status === 'cancelled') {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng')
      err.statusCode = 404
      throw err
    }

    // Chỉ hoàn stock nếu đơn chưa bị huỷ trước đó
    if (order.status === 'cancelled') {
      const err = new Error('Đơn hàng đã được huỷ trước đó')
      err.statusCode = 400
      throw err
    }

    return prisma.$transaction(async (tx) => {
      // Cập nhật status
      const updated = await tx.order.update({
        where: { id },
        data:  { status: 'cancelled' },
      })
      // Hoàn lại stock và sold
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data:  {
            stock: { increment: item.quantity },
            sold:  { decrement: item.quantity },
          },
        })
      }
      return updated
    })
  }

  // Các trạng thái khác → chỉ update status
  return prisma.order.update({ where: { id }, data: { status } })
}

// ================================
// APPROVAL REQUESTS
// ================================
export async function getRequests({ page = 1, limit = 20, status }) {
  const where = status ? { status } : {}
  const [requests, total] = await Promise.all([
    prisma.approvalRequest.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy:  { select: { id: true, name: true } },
      } }),
    prisma.approvalRequest.count({ where }),
  ])
  return { requests, total, page, totalPages: Math.ceil(total / limit) }
}

export async function createRequest({ type, targetId, targetName, note, requestedById, payload }) {
  return prisma.approvalRequest.create({ data: { type, targetId, targetName, note, requestedById, payload } })
}

export async function approveRequest(id, adminId, reviewNote) {
  const req = await prisma.approvalRequest.findUnique({ where: { id } })
  if (!req) { const e = new Error('Không tìm thấy yêu cầu'); e.statusCode = 404; throw e }
  if (req.status !== 'pending') { const e = new Error('Yêu cầu đã được xử lý'); e.statusCode = 400; throw e }

  // Thực hiện hành động
  if (req.type === 'DELETE_PRODUCT') await prisma.product.delete({ where: { id: req.targetId } })
  if (req.type === 'EDIT_USER' && req.payload) await prisma.user.update({ where: { id: req.targetId }, data: req.payload })
  if (req.type === 'RESET_PASSWORD' && req.payload?.newPassword) {
    const hashed = await bcrypt.hash(req.payload.newPassword, 10)
    await prisma.user.update({ where: { id: req.targetId }, data: { password: hashed } })
  }

  return prisma.approvalRequest.update({ where: { id }, data: { status: 'approved', reviewedById: adminId, reviewNote } })
}

export async function rejectRequest(id, adminId, reviewNote) {
  const req = await prisma.approvalRequest.findUnique({ where: { id } })
  if (!req || req.status !== 'pending') { const e = new Error('Không thể từ chối yêu cầu này'); e.statusCode = 400; throw e }
  return prisma.approvalRequest.update({ where: { id }, data: { status: 'rejected', reviewedById: adminId, reviewNote } })
}
