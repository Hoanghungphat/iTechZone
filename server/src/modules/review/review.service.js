/**
 * src/modules/review/review.service.js
 */
import { getProductReviews, findReview, createReview, deleteReview, updateReview } from './review.repository.js'
import prisma from '../../configs/database.js'

export async function listReviews(productId, { page, limit }) {
  return getProductReviews(productId, { page, limit })
}

export async function addReview(userId, productId, rating, comment) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    const err = new Error('Sản phẩm không tồn tại')
    err.statusCode = 404
    throw err
  }

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

  return createReview(userId, productId, Number(rating), comment)
}

export async function removeReview(reviewId, userId) {
  return deleteReview(reviewId, userId)
}

export async function editReview(reviewId, userId, { rating, comment }) {
  if (rating < 1 || rating > 5) {
    const err = new Error('Đánh giá phải từ 1 đến 5 sao')
    err.statusCode = 400
    throw err
  }
  return updateReview(reviewId, userId, { rating, comment })
}
