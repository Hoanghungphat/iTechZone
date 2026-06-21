/**
 * pages/Profile/index.jsx
 * Trang quản lý tài khoản cá nhân ITechZone
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Package, LogOut, Edit3 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Breadcrumb from '@/components/common/Breadcrumb'
import InputField from '@/components/forms/InputField'
import useAuthStore from '@/store/useAuthStore'
import { getMyOrders } from '@/services/orderService'
import { formatPrice, formatDate } from '@/utils/format'
import { ORDER_STATUS } from '@/constants'

// Danh sách tab điều hướng
const TABS = [
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
  { id: 'orders',  label: 'Đơn hàng',       icon: Package },
]

/**
 * Tab hồ sơ cá nhân - hiển thị và chỉnh sửa thông tin người dùng
 */
function ProfileTab({ user }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  })

  return (
    <div>
      {/* Avatar chữ cái đầu tên */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-700
                        flex items-center justify-center ring-4 ring-primary/20 flex-shrink-0">
          <span className="text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h3>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="text-xs text-primary mt-1">Thành viên từ {formatDate(user?.createdAt)}</p>
        </div>
      </div>

      {/* Form chỉnh sửa thông tin cá nhân */}
      <div className="space-y-4 max-w-md">
        <InputField
          label="Họ và tên"
          name="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          disabled
        />
        <InputField
          label="Số điện thoại"
          name="phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <button
          onClick={() => toast.success('Cập nhật thành công!')}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-semibold text-sm hover:bg-primary-700 transition-colors shadow-primary"
        >
          Lưu thay đổi
        </button>
      </div>
    </div>
  )
}

/**
 * Tab danh sách đơn hàng - tải và hiển thị lịch sử đơn hàng thật từ backend
 */
function OrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)

  const loadOrders = () => {
    setLoading(true)
    getMyOrders()
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadOrders() }, [])

  const handleCancel = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn huỷ đơn hàng này?')) return
    setCancelling(orderId)
    try {
      const { cancelOrder } = await import('@/services/orderService')
      await cancelOrder(orderId)
      toast.success('Đã huỷ đơn hàng')
      loadOrders()
    } catch (err) {
      toast.error(err.message || 'Không thể huỷ đơn hàng')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-dark-700 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!orders.length) {
    return (
      <div className="text-center py-16">
        <Package size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Bạn chưa có đơn hàng nào</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const statusKey = order.status?.toUpperCase()
        const status = ORDER_STATUS[statusKey] || ORDER_STATUS.PENDING

        return (
          <div
            key={order.id}
            className="bg-white dark:bg-dark-700/50 rounded-2xl p-5 border border-gray-100 dark:border-dark-600"
          >
            {/* Header: mã đơn + trạng thái */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white font-mono">
                  #{order.id.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
              </div>
              <span
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                {status.label}
              </span>
            </div>

            {/* Danh sách sản phẩm — dùng field thật từ backend */}
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3 mb-2">
                <img
                  src={item.productImage || item.product?.image}
                  alt={item.productName}
                  className="w-12 h-12 rounded-xl object-contain bg-gray-50 dark:bg-dark-700 p-1"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                    {item.productName}
                  </p>
                  <p className="text-xs text-gray-400">x{item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-primary">{formatPrice(item.price)}</p>
              </div>
            ))}

            {/* Tổng tiền + nút huỷ */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-600">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Tổng cộng:</span>
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(order.id)}
                    disabled={cancelling === order.id}
                    className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    {cancelling === order.id ? 'Đang huỷ...' : 'Huỷ đơn'}
                  </button>
                )}
              </div>
              <span className="font-black text-primary">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}


/**
 * Tab địa chỉ - quản lý danh sách địa chỉ giao hàng
 */
function AddressTab({ user }) {
  return (
    <div className="space-y-4">
      {/* Danh sách địa chỉ đã lưu */}
      {(user?.addresses || []).map((addr) => (
        <div
          key={addr.id}
          className="bg-white dark:bg-dark-800 rounded-2xl p-5 border border-gray-100 dark:border-dark-700"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-gray-900 dark:text-white">{addr.name}</p>
                {addr.isDefault && (
                  <span className="px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-lg">
                    Mặc định
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{addr.phone}</p>
              <p className="text-sm text-gray-500 mt-1">
                {addr.address}, {addr.ward}, {addr.district}, {addr.city}
              </p>
            </div>
            <button className="text-primary hover:text-primary-700 transition-colors">
              <Edit3 size={16} />
            </button>
          </div>
        </div>
      ))}

      {/* Nút thêm địa chỉ mới */}
      <button className="w-full py-3.5 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-2xl text-sm font-semibold text-gray-500 hover:border-primary hover:text-primary transition-colors">
        + Thêm địa chỉ mới
      </button>
    </div>
  )
}

/**
 * Trang chính quản lý tài khoản với sidebar và nội dung tab
 */
export default function ProfilePage({ defaultTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      {/* Header trang tài khoản */}
      <div className="bg-white dark:bg-dark-900 border-b border-gray-100 dark:border-dark-800 py-5">
        <div className="container-custom">
          <Breadcrumb items={[{ label: 'Tài khoản', href: '/tai-khoan' }]} />
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mt-3">
            Tài khoản của tôi
          </h1>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex gap-6">
          {/* Sidebar điều hướng (desktop) */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 w-full px-5 py-4 text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-950 text-primary border-r-2 border-primary'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}

              {/* Nút đăng xuất */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-5 py-4 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border-t border-gray-100 dark:border-dark-700"
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            </div>
          </aside>

          {/* Nội dung tab chính */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6">
              {/* Tab điều hướng dạng pill (mobile) */}
              <div className="flex md:hidden gap-1 mb-6 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Nội dung tab với animation chuyển tiếp */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'profile' && <ProfileTab user={user} />}
                {activeTab === 'orders'  && <OrdersTab />}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
