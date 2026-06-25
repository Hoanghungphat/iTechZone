/**
 * src/modules/banner/banner.routes.js
 */
import { Router } from 'express'
import { requireStaff } from '../admin/admin.middleware.js'
import {
  getPublicBanners,
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from './banner.controller.js'

// Public
export const bannerPublicRouter = Router()
bannerPublicRouter.get('/', getPublicBanners)

// Admin/Staff
export const bannerAdminRouter = Router()
bannerAdminRouter.get   ('/',    requireStaff, getAdminBanners)
bannerAdminRouter.post  ('/',    requireStaff, createBanner)
bannerAdminRouter.put   ('/:id', requireStaff, updateBanner)
bannerAdminRouter.delete('/:id', requireStaff, deleteBanner)
