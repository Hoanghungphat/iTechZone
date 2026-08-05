/**
 * services/cartSyncService.js
 * Đồng bộ giỏ hàng giữa frontend (localStorage) và backend (DB)
 */
import api from './api'

/**
 * Lưu toàn bộ local cart lên backend (clear → re-add)
 * Xoá cart cũ trước để tránh cộng dồn số lượng (POST /cart cộng thêm qty)
 */
export async function syncCartToServer(localItems) {
  if (!localItems || localItems.length === 0) return

  // Xoá cart cũ trên server trước
  await clearServerCart()

  // Thêm lại từng item với số lượng chính xác
  const requests = localItems.map(item =>
    api.post('/cart', {
      productId: item.id,
      quantity:  item.qty,
      variant:   item.variant || null,
    }).catch(() => null) // Bỏ qua lỗi từng item, không block toàn bộ
  )
  await Promise.all(requests)
}

/**
 * Lấy cart từ backend và chuyển về format frontend
 */
export async function fetchCartFromServer() {
  try {
    const res = await api.get('/cart')
    const items = res.data?.items || []
    // Map từ backend CartItem → frontend cart item shape
    return items
      .filter(item => item.product && item.product.status === 'active')
      .map(item => ({
        id:        item.product.id,
        name:      item.product.name,
        price:     item.product.price,
        thumbnail: item.product.thumbnail || item.product.image,
        stock:     item.product.stock,
        brand:     item.product.brandName,
        slug:      item.product.slug,
        qty:       item.quantity,
        variant:   item.variant || null,
      }))
  } catch {
    return null // Trả về null nếu lỗi (không xoá cart local)
  }
}

/**
 * Xoá toàn bộ cart trên server
 */
export async function clearServerCart() {
  try {
    await api.delete('/cart')
  } catch {
    // Bỏ qua lỗi — cart local vẫn được xoá
  }
}
