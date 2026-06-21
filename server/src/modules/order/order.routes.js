import { Router } from 'express'
import { protect } from '../../core/middlewares/auth.middleware.js'
import {
  placeOrderController,
  getMyOrdersController,
  getOrderDetailController,
  cancelOrderController,
  submitPaymentProofController,
} from './order.controller.js'

const router = Router()
router.use(protect)

router.post('/',                          placeOrderController)
router.get('/',                           getMyOrdersController)
router.get('/:id',                        getOrderDetailController)
router.put('/:id/cancel',                 cancelOrderController)
router.put('/:id/payment-proof',          submitPaymentProofController)

export default router
