/**
 * src/modules/review/review.controller.js
 */
import { listReviews, addReview, removeReview, editReview } from './review.service.js'
import { successResponse, paginatedResponse } from '../../core/utils/response.js'

export async function getReviewsController(req, res, next) {
  try {
    const { page = 1, limit = 10 } = req.query
    const result = await listReviews(req.params.productId, { page: Number(page), limit: Number(limit) })
    return paginatedResponse(res, result.reviews, {
      page: Number(page), limit: Number(limit),
      total: result.total, totalPages: result.totalPages,
    })
  } catch (err) { next(err) }
}

export async function createReviewController(req, res, next) {
  try {
    const { rating, comment } = req.body
    if (!rating) return res.status(400).json({ success: false, message: 'rating là bắt buộc' })
    const review = await addReview(req.user.id, req.params.productId, rating, comment)
    return successResponse(res, review, 'Đánh giá thành công', 201)
  } catch (err) { next(err) }
}

export async function deleteReviewController(req, res, next) {
  try {
    await removeReview(req.params.id, req.user.id)
    return successResponse(res, null, 'Xoá đánh giá thành công')
  } catch (err) { next(err) }
}

export async function updateReviewController(req, res, next) {
  try {
    const { rating, comment } = req.body
    if (!rating) return res.status(400).json({ success: false, message: 'rating là bắt buộc' })
    const review = await editReview(req.params.id, req.user.id, { rating, comment })
    return successResponse(res, review, 'Cập nhật đánh giá thành công')
  } catch (err) { next(err) }
}
