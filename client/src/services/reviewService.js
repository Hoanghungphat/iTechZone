/**
 * services/reviewService.js — API calls cho đánh giá sản phẩm
 * Backend routes:
 *   GET  /api/products/:productId/reviews  — lấy đánh giá
 *   POST /api/products/:productId/reviews  — gửi đánh giá (cần login)
 *   DELETE /api/reviews/:id               — xoá đánh giá
 */
import api from './api.js'

/** Lấy danh sách đánh giá của sản phẩm */
export async function getReviews(productId, { page = 1, limit = 10 } = {}) {
  const res = await api.get(`/products/${productId}/reviews`, { params: { page, limit } })
  return res.data ?? res
}

/** Gửi đánh giá mới (cần đăng nhập) */
export async function createReview(productId, { rating, comment }) {
  const res = await api.post(`/products/${productId}/reviews`, { rating, comment })
  return res.data ?? res
}

/** Xoá đánh giá của mình */
export async function deleteReview(reviewId) {
  const res = await api.delete(`/reviews/${reviewId}`)
  return res.data ?? res
}
