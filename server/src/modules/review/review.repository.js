/**
 * src/modules/review/review.repository.js
 */
import prisma from '../../configs/database.js'

export async function getProductReviews(productId, { page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where:   { productId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.review.count({ where: { productId } }),
  ])
  return { reviews, total, totalPages: Math.ceil(total / limit) }
}

export async function findReview(userId, productId) {
  return prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  })
}

export async function createReview(userId, productId, rating, comment) {
  const review = await prisma.review.create({
    data: { userId, productId, rating, comment },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  })

  // Cập nhật rating trung bình của sản phẩm
  const { _avg } = await prisma.review.aggregate({
    where:   { productId },
    _avg:    { rating: true },
  })
  await prisma.product.update({
    where: { id: productId },
    data:  { rating: Math.round((_avg.rating ?? 0) * 10) / 10 },
  })

  return review
}

export async function deleteReview(id, userId) {
  const review = await prisma.review.findFirst({ where: { id, userId } })
  if (!review) {
    const err = new Error('Không tìm thấy đánh giá')
    err.statusCode = 404
    throw err
  }
  await prisma.review.delete({ where: { id } })

  // Cập nhật lại rating trung bình
  const { _avg } = await prisma.review.aggregate({
    where: { productId: review.productId },
    _avg:  { rating: true },
  })
  await prisma.product.update({
    where: { id: review.productId },
    data:  { rating: Math.round((_avg.rating ?? 0) * 10) / 10 },
  })
}

export async function updateReview(id, userId, { rating, comment }) {
  const review = await prisma.review.findFirst({ where: { id, userId } })
  if (!review) {
    const err = new Error('Không tìm thấy đánh giá hoặc bạn không có quyền sửa')
    err.statusCode = 404
    throw err
  }

  const updated = await prisma.review.update({
    where:   { id },
    data:    { rating: Number(rating), comment },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  })

  // Cập nhật lại rating trung bình sản phẩm
  const { _avg } = await prisma.review.aggregate({
    where: { productId: review.productId },
    _avg:  { rating: true },
  })
  await prisma.product.update({
    where: { id: review.productId },
    data:  { rating: Math.round((_avg.rating ?? 0) * 10) / 10 },
  })

  return updated
}
