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

export async function seedDefaultBanners() {
  const count = await prisma.banner.count()
  if (count > 0) return
  await prisma.banner.createMany({
    data: [
      { tag: 'iPhone 15 Pro', title: 'iPhone 15 Pro Max', subtitle: 'Chip A17 Pro · Camera 48MP · Titanium', price: 34990000, originalPrice: 37990000, ctaText: 'Mua ngay', href: '/san-pham/apple-iphone-15-pro-max-256gb', image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_1__1.png', gradient: 'from-dark-900 via-dark-800 to-dark-900', accent: '#e51c1c', sortOrder: 0 },
      { tag: 'Galaxy AI', title: 'Samsung S24 Ultra', subtitle: 'S Pen · 200MP · Snapdragon 8 Gen 3', price: 31990000, originalPrice: 34990000, ctaText: 'Khám phá', href: '/san-pham/samsung-galaxy-s24-ultra-256gb', image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/a/samsung-galaxy-s24-ultra_1.png', gradient: 'from-dark-900 via-blue-950 to-dark-900', accent: '#1d4ed8', sortOrder: 1 },
      { tag: 'iPad Pro M4', title: 'Mỏng nhất từ trước đến nay', subtitle: 'Chip M4 · Màn hình OLED · Ultra Retina XDR', price: 26990000, originalPrice: 28990000, ctaText: 'Tìm hiểu thêm', href: '/san-pham/apple-ipad-pro-m4-11-inch-256gb-wifi', image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/ipad-pro-m4-11-inch_1.png', gradient: 'from-dark-900 via-indigo-950 to-dark-900', accent: '#6366f1', sortOrder: 2 },
    ],
  })
  console.log('   ✔ Seeded 3 default banners')
}

// ================================
// DASHBOARD
// ================================
export async function getDashboardStats() {
  const now = new Date()

  // Khung thời gian
  const startOfThisWeek = new Date(now); startOfThisWeek.setDate(now.getDate() - 6); startOfThisWeek.setHours(0,0,0,0)
  const startOfLastWeek = new Date(startOfThisWeek); startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)
  const endOfLastWeek   = new Date(startOfThisWeek)

  const [
    totalProducts,
    totalUsers,
    totalOrders,
    totalRevenue,
    pendingRequests,
    recentOrders,
    // So sánh tuần trước
    lastWeekOrders,
    lastWeekRevenue,
    lastWeekUsers,
    // Doanh thu 7 ngày gần nhất (theo ngày)
    dailyOrders,
    // Top sản phẩm bán chạy
    topOrderItems,
    // Sản phẩm theo danh mục
    productsByCategory,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({ where: { role: 'user' } }),
    prisma.order.count({ where: { status: { not: 'cancelled' } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { not: 'cancelled' } } }),
    prisma.approvalRequest.count({ where: { status: 'pending' } }),
    prisma.order.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    }),
    // tuần trước: đơn hàng
    prisma.order.count({ where: { status: { not: 'cancelled' }, createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } }),
    // tuần trước: doanh thu
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { not: 'cancelled' }, createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } }),
    // tuần trước: user mới
    prisma.user.count({ where: { role: 'user', createdAt: { gte: startOfLastWeek, lt: endOfLastWeek } } }),
    // Đơn hàng 7 ngày (để tính doanh thu theo ngày)
    prisma.order.findMany({
      where: { status: { not: 'cancelled' }, createdAt: { gte: startOfThisWeek } },
      select: { createdAt: true, totalAmount: true },
    }),
    // Top sản phẩm (group by product name)
    prisma.orderItem.groupBy({
      by: ['productName'],
      _sum: { quantity: true, price: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    // Sản phẩm theo danh mục
    prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
    }),
  ])

  // Build revenue chart (last 7 days)
  const revenueChart = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const label = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
    const dayStart = new Date(d); dayStart.setHours(0,0,0,0)
    const dayEnd   = new Date(d); dayEnd.setHours(23,59,59,999)
    const revenue  = dailyOrders
      .filter(o => o.createdAt >= dayStart && o.createdAt <= dayEnd)
      .reduce((s, o) => s + (o.totalAmount || 0), 0)
    revenueChart.push({ date: label, revenue })
  }

  // Category breakdown
  const catTotal = productsByCategory.reduce((s, c) => s + c._count.id, 0)
  const CATEGORY_LABELS = { phone: 'Điện thoại', tablet: 'Máy tính bảng', accessory: 'Phụ kiện', earphone: 'Tai nghe' }
  const categoryBreakdown = productsByCategory.map(c => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    value: Math.round((c._count.id / catTotal) * 100),
  })).sort((a, b) => b.value - a.value)

  // % change helpers
  const pct = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100)

  const thisWeekOrders  = dailyOrders.length
  const thisWeekRevenue = dailyOrders.reduce((s, o) => s + (o.totalAmount || 0), 0)
  const thisWeekUsers   = await prisma.user.count({ where: { role: 'user', createdAt: { gte: startOfThisWeek } } })

  return {
    totalProducts,
    totalUsers,
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    pendingRequests,
    recentOrders,
    revenueChart,
    topProducts: topOrderItems.map(item => {
      // unit_price = tổng price / số rows (vì price trong mỗi row là unit price)
      const unitPrice = item._count.id > 0 ? (item._sum.price || 0) / item._count.id : 0
      const totalQty  = item._sum.quantity || 0
      return {
        name:    item.productName,
        sold:    totalQty,
        revenue: Math.round(unitPrice * totalQty),
      }
    }),
    categoryBreakdown,
    changes: {
      orders:  pct(thisWeekOrders,  lastWeekOrders),
      revenue: pct(thisWeekRevenue, lastWeekRevenue._sum.totalAmount || 0),
      users:   pct(thisWeekUsers,   lastWeekUsers),
    },
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

export async function updateOrderStatus(id, status, version, actor) {
  // Optimistic locking: chỉ update nếu version khớp
  if (version !== undefined) {
    const result = await prisma.order.updateMany({
      where:  { id, version },
      data:   { status, version: { increment: 1 } },
    })
    if (result.count === 0) {
      // Kiểm tra đơn có tồn tại không
      const exists = await prisma.order.findUnique({ where: { id } })
      if (!exists) { const e = new Error('Không tìm thấy đơn hàng'); e.statusCode = 404; throw e }
      // Tồn tại nhưng version không khớp → conflict
      const e = new Error(`Đơn hàng đã được xử lý bởi nhân viên khác. Vui lòng tải lại trang.`)
      e.statusCode = 409; throw e
    }
    // Nếu hủy đơn → hoàn stock
    if (status === 'cancelled') {
      const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
      if (order) {
        await prisma.$transaction(
          order.items.filter(i => i.productId).map(item =>
            prisma.product.update({
              where: { id: item.productId },
              data:  { stock: { increment: item.quantity }, sold: { decrement: item.quantity } },
            })
          )
        )
      }
    }
    if (actor) await createLog(actor, 'UPDATE_ORDER_STATUS', 'order', id, `Chuyển trạng thái đơn ${id.slice(0,8)} → ${status}`)
    return prisma.order.findUnique({ where: { id } })
  }

  // Fallback không có version (legacy)
  if (status === 'cancelled') {
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
    if (!order) { const err = new Error('Không tìm thấy đơn hàng'); err.statusCode = 404; throw err }
    if (order.status === 'cancelled') { const err = new Error('Đơn hàng đã được huỷ trước đó'); err.statusCode = 400; throw err }
    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({ where: { id }, data: { status: 'cancelled', version: { increment: 1 } } })
      for (const item of order.items) {
        if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity }, sold: { decrement: item.quantity } } })
      }
      return updated
    })
  }
  return prisma.order.update({ where: { id }, data: { status, version: { increment: 1 } } })
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
  const req = await prisma.approvalRequest.findUnique({ where: { id }, include: { requestedBy: { select: { name: true } } } })
  if (!req) { const e = new Error('Không tìm thấy yêu cầu'); e.statusCode = 404; throw e }
  if (req.status !== 'pending') { const e = new Error('Yêu cầu đã được xử lý'); e.statusCode = 400; throw e }

  if (req.type === 'DELETE_PRODUCT') await prisma.product.delete({ where: { id: req.targetId } })
  if (req.type === 'EDIT_USER' && req.payload) await prisma.user.update({ where: { id: req.targetId }, data: req.payload })
  if (req.type === 'RESET_PASSWORD' && req.payload?.newPassword) {
    const hashed = await bcrypt.hash(req.payload.newPassword, 10)
    await prisma.user.update({ where: { id: req.targetId }, data: { password: hashed } })
  }

  const updated = await prisma.approvalRequest.update({ where: { id }, data: { status: 'approved', reviewedById: adminId, reviewNote } })
  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, role: true } })
  if (admin) await createLog(
    { id: adminId, name: admin.name, role: admin.role },
    'APPROVE_REQUEST', 'request', id,
    `Duyệt yêu cầu "${req.type}" — ${req.targetName} (bởi ${req.requestedBy?.name})`
  )
  return updated
}

// ================================
// ACTIVITY LOG
// ================================
export async function createLog(actor, action, targetType, targetId, detail) {
  try {
    await prisma.activityLog.create({
      data: { userId: actor.id, userName: actor.name, userRole: actor.role, action, targetType, targetId, detail },
    })
  } catch (err) {
    console.error('createLog error:', err.message)
  }
}

export async function getLogs({ page = 1, limit = 30, userId, action }) {
  const where = {}
  if (userId) where.userId = userId
  if (action) where.action = { contains: action, mode: 'insensitive' }
  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.activityLog.count({ where }),
  ])
  return { logs, total, page, totalPages: Math.ceil(total / limit) }
}

export async function rejectRequest(id, adminId, reviewNote) {
  const req = await prisma.approvalRequest.findUnique({ where: { id }, include: { requestedBy: { select: { name: true } } } })
  if (!req || req.status !== 'pending') { const e = new Error('Không thể từ chối yêu cầu này'); e.statusCode = 400; throw e }
  const updated = await prisma.approvalRequest.update({ where: { id }, data: { status: 'rejected', reviewedById: adminId, reviewNote } })
  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, role: true } })
  if (admin) await createLog(
    { id: adminId, name: admin.name, role: admin.role },
    'REJECT_REQUEST', 'request', id,
    `Từ chối yêu cầu "${req.type}" — ${req.targetName} (bởi ${req.requestedBy?.name})`
  )
  return updated
}

// ================================
// PASSWORD RESET REQUESTS (admin xử lý yêu cầu quên MK từ người dùng)
// ================================

/** Admin xem toàn bộ yêu cầu (có thể lọc theo status) */
export async function listPasswordResetRequests({ status, page = 1, limit = 20 }) {
  const where = {}
  if (status) where.status = status

  const [requests, total] = await Promise.all([
    prisma.passwordResetRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
    prisma.passwordResetRequest.count({ where }),
  ])
  return { requests, total, page, limit }
}

/** Admin hoàn thành yêu cầu — đặt mật khẩu tạm cho user */
export async function completePasswordReset(id, tempPassword, adminId) {
  if (!tempPassword || tempPassword.length < 6) {
    const err = new Error('Mật khẩu tạm phải có ít nhất 6 ký tự')
    err.statusCode = 400
    throw err
  }

  const req = await prisma.passwordResetRequest.findUnique({
    where: { id },
    include: { user: { select: { name: true, phone: true } } },
  })
  if (!req) {
    const err = new Error('Không tìm thấy yêu cầu')
    err.statusCode = 404
    throw err
  }
  if (req.status !== 'pending') {
    const err = new Error('Yêu cầu này đã được xử lý')
    err.statusCode = 409
    throw err
  }

  // Hash và cập nhật mật khẩu user
  const hashed = await bcrypt.hash(tempPassword, 10)
  await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } })

  // Cập nhật request: lưu tempPassword rõ (để staff xem) + mark completed
  const updated = await prisma.passwordResetRequest.update({
    where: { id },
    data: { status: 'completed', tempPassword, completedAt: new Date() },
  })

  // Ghi log
  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, role: true } })
  if (admin) await createLog(
    { id: adminId, name: admin.name, role: admin.role },
    'RESET_USER_PASSWORD', 'user', req.userId,
    `Đặt lại mật khẩu cho "${req.user?.name}" (${req.user?.phone || 'chưa có SĐT'})`
  )

  return updated
}

/** Admin huỷ yêu cầu */
export async function cancelPasswordReset(id, adminId) {
  const req = await prisma.passwordResetRequest.findUnique({ where: { id } })
  if (!req || req.status !== 'pending') {
    const err = new Error('Không thể huỷ yêu cầu này')
    err.statusCode = 400
    throw err
  }
  const updated = await prisma.passwordResetRequest.update({ where: { id }, data: { status: 'cancelled' } })
  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true, role: true } })
  if (admin) await createLog(
    { id: adminId, name: admin.name, role: admin.role },
    'CANCEL_PASSWORD_RESET', 'user', req.userId, 'Huỷ yêu cầu đặt lại mật khẩu'
  )
  return updated
}

/** Staff xem yêu cầu đã hoàn thành — CHỈ thấy SĐT + MK tạm (không thấy email) */
export async function listStaffPasswordResets({ page = 1, limit = 20 } = {}) {
  const [requests, total] = await Promise.all([
    prisma.passwordResetRequest.findMany({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { phone: true } }, // CHỈ lấy SĐT, không có tên/email
      },
    }),
    prisma.passwordResetRequest.count({ where: { status: 'completed' } }),
  ])
  return {
    requests: requests.map(r => ({
      id: r.id,
      phone: r.user?.phone || 'Chưa có SĐT',
      tempPassword: r.tempPassword,
      completedAt: r.completedAt,
    })),
    total, page, limit,
  }
}

