/**
 * CartSummary.jsx — Tóm tắt đơn hàng
 * Nút "Thanh toán ngay" sẽ yêu cầu đăng nhập nếu chưa có tài khoản
 */
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatPrice } from '@/utils/format'
import useAuthStore from '@/store/useAuthStore'

export default function CartSummary({ items = [], showCheckoutBtn = true }) {
  const { token } = useAuthStore()
  const navigate = useNavigate()

  // Tính tạm tính, phí ship và tổng cộng
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  // Miễn phí ship cho đơn trên 5 triệu
  const shipping = subtotal > 5_000_000 ? 0 : 30_000
  const total = subtotal + shipping

  const handleCheckout = () => {
    if (!token) {
      toast.error('Vui lòng đăng nhập để tiến hành thanh toán', {
        icon: '🔒',
        duration: 3000,
      })
      // Lưu trang hiện tại để redirect về sau khi đăng nhập
      navigate('/dang-nhap', { state: { from: '/thanh-toan' } })
      return
    }
    navigate('/thanh-toan')
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl p-5
                    border border-gray-100 dark:border-dark-700 space-y-4">
      <h3 className="font-bold text-gray-900 dark:text-white text-base">Tóm tắt đơn hàng</h3>

      {/* Chi tiết giá */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Tạm tính ({items.length} sản phẩm)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Phí vận chuyển</span>
          <span className={shipping === 0 ? 'text-green-500 font-semibold' : ''}>
            {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
          </span>
        </div>
        {/* Thông báo miễn phí vận chuyển */}
        {shipping === 0 && (
          <p className="text-xs text-green-500 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-xl">
            ✓ Bạn được miễn phí vận chuyển!
          </p>
        )}
      </div>

      {/* Tổng cộng */}
      <div className="border-t border-gray-100 dark:border-dark-700 pt-4">
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-900 dark:text-white">Tổng cộng</span>
          <span className="text-xl font-black text-primary">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Nút thanh toán — check auth tại đây */}
      {showCheckoutBtn && (
        <button
          onClick={handleCheckout}
          className="flex items-center justify-center gap-2 w-full
                     py-3.5 bg-primary text-white rounded-2xl
                     font-semibold hover:bg-primary-700
                     transition-colors shadow-primary text-sm"
        >
          {!token && <Lock size={15} />}
          Thanh toán ngay
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  )
}
