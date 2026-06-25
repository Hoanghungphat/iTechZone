/**
 * src/modules/product/product.repository.js
 * Tầng data access — tương tác trực tiếp với Prisma / PostgreSQL
 */
import prisma from '../../configs/database.js'

// ================================
// HELPERS
// ================================

/**
 * Build Prisma WHERE clause từ query params
 */
function buildWhere({ q, brand, category, excludeCategory, status, minPrice, maxPrice }) {
  const where = {}

  if (status) {
    where.status = status
  } else {
    where.status = 'active' // mặc định chỉ lấy active
  }

  if (category) where.category = category
  if (brand)    where.brand    = brand

  // Loại trừ danh mục khỏi kết quả
  if (excludeCategory) {
    where.NOT = { category: excludeCategory }
  }

  if (q) {
    where.OR = [
      { name:        { contains: q, mode: 'insensitive' } },
      { brandName:   { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) where.price.gte = Number(minPrice)
    if (maxPrice !== undefined) where.price.lte = Number(maxPrice)
  }

  return where
}

/**
 * Build Prisma ORDER BY clause từ sort/order params
 */
function buildOrderBy(sort, order = 'desc') {
  const dir = order === 'asc' ? 'asc' : 'desc'

  switch (sort) {
    case 'price':     return { price: dir }
    case 'rating':    return { rating: dir }
    case 'sold':      return { sold: dir }
    case 'createdAt': return { createdAt: dir }
    case 'name':      return { name: dir }
    default:          return { createdAt: 'desc' }
  }
}

// ================================
// QUERIES
// ================================

export async function findProducts({
  page            = 1,
  limit           = 12,
  q,
  brand,
  category,
  excludeCategory,
  status,
  minPrice,
  maxPrice,
  sort            = 'createdAt',
  order           = 'desc',
} = {}) {
  const pageNum  = Math.max(1, Number(page))
  const limitNum = Math.min(100, Math.max(1, Number(limit)))
  const skip     = (pageNum - 1) * limitNum

  const where   = buildWhere({ q, brand, category, excludeCategory, status, minPrice, maxPrice })
  const orderBy = buildOrderBy(sort, order)

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip, take: limitNum }),
    prisma.product.count({ where }),
  ])

  return {
    data: products,
    pagination: {
      page:       pageNum,
      limit:      limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  }
}

export async function findProductById(id) {
  const p = await prisma.product.findUnique({
    where:   { id },
    include: { _count: { select: { reviews: true } } },
  })
  if (!p) return null
  const { _count, ...rest } = p
  return { ...rest, reviewCount: _count.reviews }
}

export async function findProductBySlug(slug) {
  const p = await prisma.product.findUnique({
    where:   { slug },
    include: { _count: { select: { reviews: true } } },
  })
  if (!p) return null
  const { _count, ...rest } = p
  return { ...rest, reviewCount: _count.reviews }
}

export async function findRelatedProducts(productId, limit = 6) {
  const current = await prisma.product.findUnique({ where: { id: productId } })
  if (!current) return []

  return prisma.product.findMany({
    where: {
      id:  { not: productId },
      OR:  [{ category: current.category }, { brand: current.brand }],
      status: 'active',
    },
    take:    Number(limit),
    orderBy: { sold: 'desc' },
  })
}

export async function findFeaturedProducts({ category, limit = 8 } = {}) {
  const where = { isFeatured: true, status: 'active' }
  if (category) where.category = category

  return prisma.product.findMany({
    where,
    take:    Number(limit),
    orderBy: { sold: 'desc' },
  })
}

export async function findFlashSaleProducts({ limit = 8 } = {}) {
  return prisma.product.findMany({
    where:   { isFlashSale: true, status: 'active' },
    take:    Number(limit),
    orderBy: { sold: 'desc' },
  })
}

export async function searchProductsRepo({ q, limit = 20 } = {}) {
  if (!q || q.trim().length < 2) return []

  return prisma.product.findMany({
    where: {
      status: 'active',
      OR: [
        { name:        { contains: q, mode: 'insensitive' } },
        { brandName:   { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    take:    Number(limit),
    orderBy: { sold: 'desc' },
  })
}

export async function createProductRepo(data) {
  return prisma.product.create({ data })
}

export async function updateProductRepo(id, data) {
  return prisma.product.update({ where: { id }, data })
}

export async function deleteProductRepo(id) {
  return prisma.product.delete({ where: { id } })
}
