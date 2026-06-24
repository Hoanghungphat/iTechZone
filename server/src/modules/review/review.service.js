/**
 * src/modules/review/review.service.js
 */
import { getProductReviews, findReview, createReview, deleteReview } from './review.repository.js'
import prisma from '../../configs/database.js'

/** Tính lại rating + reviewCount từ bảng reviews rồi cập nhật vào Product */
async function syncProductRating(productId) {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg:   { rating: true },
    _count: { id: true },
  })
  const avg   = agg._avg.rating ? +agg._avg.rating.toFixed(1) : 0
  const count = agg._count.id ?? 0
  await prisma.product.update({
    where: { id: productId },
    data:  { rating: avg, reviewCount: count },
  })
}

export async function listReviews(productId, { page, limit }) {
  return getProductReviews(productId, { page, limit })
}

export async function addReview(userId, productId, rating, comment) {
  // Kiểm tra sản phẩm tồn tại
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    const err = new Error('Sản phẩm không tồn tại')
    err.statusCode = 404
    throw err
  }

  // Kiểm tra đã review chưa
  const existing = await findReview(userId, productId)
  if (existing) {
    const err = new Error('Bạn đã đánh giá sản phẩm này rồi')
    err.statusCode = 409
    throw err
  }

  if (rating < 1 || rating > 5) {
    const err = new Error('Đánh giá phải từ 1 đến 5 sao')
    err.statusCode = 400
    throw err
  }

  const review = await createReview(userId, productId, Number(rating), comment)
  // Cập nhật rating + reviewCount thật lên Product
  await syncProductRating(productId)
  return review
}

export async function removeReview(reviewId, userId) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } })
  await deleteReview(reviewId, userId)
  // Cập nhật lại sau khi xoá
  if (review) await syncProductRating(review.productId)
}
