/**
 * services/reviewService.js — API calls cho đánh giá sản phẩm
 */
import api from './api.js'

/** Lấy danh sách đánh giá của sản phẩm */
export async function getReviews(productId, { page = 1, limit = 10 } = {}) {
  const res = await api.get(`/reviews/${productId}`, { params: { page, limit } })
  return res.data ?? res
}

/** Gửi đánh giá mới (cần đăng nhập) */
export async function createReview(productId, { rating, comment }) {
  const res = await api.post(`/reviews/${productId}`, { rating, comment })
  return res.data ?? res
}

/** Xoá đánh giá của mình */
export async function deleteReview(reviewId) {
  const res = await api.delete(`/reviews/${reviewId}`)
  return res.data ?? res
}
