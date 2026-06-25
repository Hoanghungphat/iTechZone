/**
 * src/modules/banner/banner.controller.js
 */
import prisma from '../../configs/database.js'
import { successResponse } from '../../core/utils/response.js'

export async function getPublicBanners(req, res, next) {
  try {
    const banners = await prisma.banner.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return successResponse(res, banners)
  } catch (e) { next(e) }
}

export async function getAdminBanners(req, res, next) {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } })
    return successResponse(res, banners)
  } catch (e) { next(e) }
}

export async function createBanner(req, res, next) {
  try {
    const { tag, title, subtitle, price, originalPrice, ctaText, href, image, gradient, accent, isActive, sortOrder } = req.body
    if (!tag || !title) return res.status(400).json({ success: false, message: 'tag và title là bắt buộc' })
    const banner = await prisma.banner.create({
      data: { tag, title, subtitle: subtitle || '', price: +price || 0, originalPrice: +originalPrice || 0, ctaText: ctaText || 'Khám phá', href: href || '/', image: image || '', gradient: gradient || 'from-dark-900 via-dark-800 to-dark-900', accent: accent || '#e51c1c', isActive: isActive !== false, sortOrder: +sortOrder || 0 },
    })
    return successResponse(res, banner, 'Tạo banner thành công', 201)
  } catch (e) { next(e) }
}

export async function updateBanner(req, res, next) {
  try {
    const { id } = req.params
    const data = req.body
    if (data.price)         data.price         = +data.price
    if (data.originalPrice) data.originalPrice = +data.originalPrice
    if (data.sortOrder)     data.sortOrder     = +data.sortOrder
    const banner = await prisma.banner.update({ where: { id }, data })
    return successResponse(res, banner, 'Cập nhật thành công')
  } catch (e) { next(e) }
}

export async function deleteBanner(req, res, next) {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } })
    return successResponse(res, null, 'Đã xoá banner')
  } catch (e) { next(e) }
}
