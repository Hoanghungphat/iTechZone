/**
 * hooks/useAddToCart.js
 * Hook bọc addItem — KHÔNG yêu cầu đăng nhập khi thêm vào giỏ
 * Auth chỉ được kiểm tra khi bấm Thanh toán (ở CartSummary / handleBuyNow)
 */
import useCartStore from '@/store/useCartStore'

export function useAddToCart() {
  const { addItem, openDrawer } = useCartStore()

  /**
   * Thêm sản phẩm vào giỏ — KHÔNG yêu cầu đăng nhập
   * @param {Object} product  - Sản phẩm cần thêm
   * @param {number} qty      - Số lượng (mặc định 1)
   * @param {boolean} openCart - Có mở drawer sau khi thêm không (mặc định true)
   */
  const addToCart = (product, qty = 1, openCart = true) => {
    addItem(product, qty)
    if (openCart) openDrawer()
    return true
  }

  return { addToCart }
}
