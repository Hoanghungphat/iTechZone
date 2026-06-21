/**
 * services/orderService.js
 * Service xử lý đơn hàng — kết nối API thật
 */
import api from './api'

/**
 * Tạo đơn hàng mới từ giỏ hàng
 */
export async function createOrder(orderData) {
  const res = await api.post('/orders', orderData)
  return res.data
}

/**
 * Lấy danh sách đơn hàng của user đang đăng nhập
 */
export async function getMyOrders() {
  const res = await api.get('/orders')
  return res.data
}

/**
 * Lấy chi tiết đơn hàng theo ID
 */
export async function getOrderById(orderId) {
  const res = await api.get(`/orders/${orderId}`)
  return res.data
}

/**
 * Huỷ đơn hàng (chỉ khi đang pending)
 */
export async function cancelOrder(orderId) {
  const res = await api.put(`/orders/${orderId}/cancel`)
  return res.data
}

/**
 * Gửi ảnh xác nhận chuyển khoản
 */
export async function submitPaymentProof(orderId, proofImage) {
  const res = await api.put(`/orders/${orderId}/payment-proof`, { proofImage })
  return res.data
}
