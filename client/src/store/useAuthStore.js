/**
 * store/useAuthStore.js
 * Zustand store quản lý authentication
 *
 * Chiến lược cart:
 *  - Đăng nhập  → khôi phục cart từ server (DB)
 *  - Đăng xuất  → xoá local cart (cart ở server vẫn còn để khôi phục lần sau)
 *  - Đăng ký    → local cart được sync lên server (nếu có items)
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/constants'
import {
  login as loginService,
  logout as logoutService,
  register as registerService,
} from '@/services/authService'
import { fetchCartFromServer, syncCartToServer } from '@/services/cartSyncService'

const useAuthStore = create(
  persist(
    (set) => ({
      // ================================
      // STATE
      // ================================
      user:      null,
      token:     null,
      isLoading: false,
      error:     null,

      // ================================
      // ACTIONS
      // ================================

      /**
       * Đăng nhập
       * Sau khi đăng nhập → tải cart từ server → set vào local cart
       */
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await loginService(email, password)
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
          set({ user, token, isLoading: false })

          // Nếu là admin/staff → sync token vào useAdminStore để AdminRoute hoạt động
          if (['admin', 'staff'].includes(user.role)) {
            const { default: useAdminStore } = await import('./useAdminStore')
            localStorage.setItem('itechzone_admin_token', token)
            useAdminStore.getState().setAdminFromAuth(user, token)
            return { success: true, role: user.role }
          }

          // Khôi phục cart từ server (lazy import tránh circular dep)
          const { default: useCartStore } = await import('./useCartStore')
          const serverItems = await fetchCartFromServer()
          if (serverItems && serverItems.length > 0) {
            useCartStore.getState().setItems(serverItems)
          }

          return { success: true, role: user.role }
        } catch (err) {
          set({ isLoading: false, error: err.message })
          return { success: false, error: err.message }
        }
      },

      /**
       * Đăng ký
       * Nếu có items trong local cart → sync lên server
       */
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const { user, token } = await registerService(userData)
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
          set({ user, token, isLoading: false })

          // Sync local cart lên server nếu user vừa đăng ký và đã có items
          const { default: useCartStore } = await import('./useCartStore')
          const localItems = useCartStore.getState().items
          if (localItems.length > 0) {
            await syncCartToServer(localItems)
          }

          return { success: true }
        } catch (err) {
          set({ isLoading: false, error: err.message })
          return { success: false, error: err.message }
        }
      },

      /**
       * Đăng xuất
       * Local cart bị xoá → khi đăng nhập lại sẽ lấy cart từ server
       * Cart trên server vẫn được giữ nguyên
       */
      logout: async () => {
        // Sync cart lên server trước khi xoá local (đảm bảo không mất dữ liệu)
        try {
          const { default: useCartStore } = await import('./useCartStore')
          const localItems = useCartStore.getState().items
          if (localItems.length > 0) {
            await syncCartToServer(localItems)
          }
          // Xoá local cart
          useCartStore.getState().clearCart()
        } catch {
          // Bỏ qua lỗi sync — vẫn đăng xuất bình thường
          const { default: useCartStore } = await import('./useCartStore')
          useCartStore.getState().clearCart()
        }

        logoutService()
        set({ user: null, token: null, error: null })
      },

      /**
       * Cập nhật user info
       */
      setUser: (user) => set({ user }),

      /**
       * Xóa lỗi
       */
      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEYS.USER,
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

export default useAuthStore
