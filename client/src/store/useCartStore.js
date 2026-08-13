/**
 * store/useCartStore.js
 * Zustand store quản lý giỏ hàng
 * Tự động persist vào localStorage + sync server real-time khi đã đăng nhập
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/constants'

// ────────────────────────────────────────────────────
// Helper: sync cart lên server (chỉ khi đã đăng nhập)
// Dùng dynamic import để tránh circular dependency
// Debounce 400ms để gộp nhiều thao tác liên tiếp
// ────────────────────────────────────────────────────
let syncTimer = null

function scheduleServerSync(getItems) {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  if (!token) return // Guest → không cần sync server

  clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try {
      const { syncCartToServer, clearServerCart } = await import('@/services/cartSyncService')
      const items = getItems()
      if (items.length > 0) {
        await syncCartToServer(items)
      } else {
        await clearServerCart()
      }
    } catch {
      // sync lỗi → bỏ qua, không ảnh hưởng UX
    }
  }, 400)
}

const useCartStore = create(
  persist(
    (set, get) => ({
      // ================================
      // STATE
      // ================================
      items: [],           // Danh sách sản phẩm trong giỏ
      isDrawerOpen: false, // Trạng thái mở/đóng Cart Drawer

      // ================================
      // GETTERS
      // ================================

      // Tổng số lượng sản phẩm
      get totalItems() {
        return get().items.reduce((sum, item) => sum + item.qty, 0)
      },

      // Tổng tiền
      get totalPrice() {
        return get().items.reduce((sum, item) => sum + item.price * item.qty, 0)
      },

      // Kiểm tra sản phẩm đã có trong giỏ chưa
      isInCart: (productId) => {
        return get().items.some(item => item.id === productId)
      },

      // Lấy số lượng của 1 sản phẩm
      getItemQty: (productId) => {
        const item = get().items.find(i => i.id === productId)
        return item?.qty || 0
      },

      // ================================
      // ACTIONS
      // ================================

      /**
       * Thêm sản phẩm vào giỏ
       * @param {Object} product - Sản phẩm cần thêm
       * @param {number} qty - Số lượng (mặc định 1)
       */
      addItem: (product, qty = 1) => {
        set((state) => {
          const existing = state.items.find(i => i.id === product.id)

          if (existing) {
            return {
              items: state.items.map(i =>
                i.id === product.id
                  ? { ...i, qty: Math.min(i.qty + qty, i.stock || 99) }
                  : i
              ),
            }
          }

          return {
            items: [...state.items, {
              id: product.id,
              slug: product.slug,
              name: product.name,
              brand: product.brandName,
              price: product.price,
              thumbnail: product.thumbnail,
              stock: product.stock || 99,
              qty,
            }],
          }
        })
        scheduleServerSync(() => get().items)
      },

      /**
       * Xóa sản phẩm khỏi giỏ — sync server ngay
       */
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(i => i.id !== productId),
        }))
        scheduleServerSync(() => get().items)
      },

      /**
       * Cập nhật số lượng — sync server ngay
       */
      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map(i =>
            i.id === productId
              ? { ...i, qty: Math.min(qty, i.stock || 99) }
              : i
          ),
        }))
        scheduleServerSync(() => get().items)
      },

      /**
       * Xóa toàn bộ giỏ hàng + sync server
       */
      clearCart: () => {
        set({ items: [] })
        scheduleServerSync(() => [])
      },

      /**
       * Xóa local cart MÀ KHÔNG sync server
       * Dùng khi logout (đã sync server trước rồi)
       */
      clearLocalCart: () => {
        set({ items: [] })
      },

      /**
       * Set toàn bộ items (dùng khi khôi phục cart từ server sau login)
       * KHÔNG sync server để tránh vòng lặp
       */
      setItems: (items) => set({ items }),

      /**
       * Mở/đóng Cart Drawer
       */
      openDrawer:  () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
    }),
    {
      name: STORAGE_KEYS.CART,
      partialize: (state) => ({ items: state.items }),
      // Sau khi page refresh, nếu user đã đăng nhập và có items local
      // → re-sync lên server để đảm bảo server luôn có đúng cart
      onRehydrateStorage: () => (state) => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        if (token && state?.items?.length > 0) {
          setTimeout(async () => {
            try {
              const { syncCartToServer } = await import('@/services/cartSyncService')
              await syncCartToServer(state.items)
            } catch { /* bỏ qua nếu lỗi */ }
          }, 1500) // đợi app khởi động xong
        }
      },
    }
  )
)

export default useCartStore
