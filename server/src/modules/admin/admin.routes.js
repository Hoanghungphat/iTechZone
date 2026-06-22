/**
 * src/modules/admin/admin.routes.js
 */
import { Router } from 'express'
import { requireAdmin, requireStaff } from './admin.middleware.js'
import * as ctrl from './admin.controller.js'

const router = Router()

// ---- Auth (public) ----
router.post('/login', ctrl.adminLogin)

// ---- Dashboard ----
router.get('/dashboard', requireAdmin, ctrl.dashboard)

// ---- Products (Admin + Staff) ----
router.get('/products',        requireStaff,  ctrl.listProducts)
router.post('/products',       requireStaff,  ctrl.addProduct)
router.put('/products/:id',    requireStaff,  ctrl.editProduct)
router.delete('/products/:id', requireStaff,  ctrl.removeProduct)  // staff → request, admin → delete

// ---- Users (Admin only) ----
router.get('/users',                     requireAdmin, ctrl.listUsers)
router.put('/users/:id',                 requireStaff, ctrl.editUser)
router.post('/users/:id/reset-password', requireStaff, ctrl.resetUserPassword)
router.patch('/users/:id/toggle',        requireAdmin, ctrl.toggleUser)
router.delete('/users/:id',              requireAdmin, ctrl.removeUser)

// ---- Staff (Admin only) ----
router.get('/staff',        requireAdmin, ctrl.listStaff)
router.post('/staff',       requireAdmin, ctrl.addStaff)
router.delete('/staff/:id', requireAdmin, ctrl.removeStaff)

// ---- Orders (Admin + Staff) ----
router.get('/orders',              requireStaff, ctrl.listOrders)
router.patch('/orders/:id/status', requireStaff, ctrl.changeOrderStatus)

// ---- Approval Requests ----
router.get('/requests',               requireStaff, ctrl.listRequests)   // staff xem được, không duyệt
router.patch('/requests/:id/approve', requireAdmin, ctrl.approve)
router.patch('/requests/:id/reject',  requireAdmin, ctrl.reject)

export default router
