/**
 * pages/Admin/Layout/index.jsx — Sidebar + Header cho Admin Panel
 */
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, ShoppingBag,
  ClipboardList, UserCog, LogOut, Shield, Menu, X, ChevronRight, Home, Activity, KeyRound
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import useAdminStore from '@/store/useAdminStore'

const NAV_ADMIN = [
  { to: '/admin/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products',        icon: Package,          label: 'Sản phẩm' },
  { to: '/admin/orders',          icon: ShoppingBag,      label: 'Đơn hàng' },
  { to: '/admin/users',           icon: Users,            label: 'Người dùng' },
  { to: '/admin/staff',           icon: UserCog,          label: 'Nhân viên' },
  { to: '/admin/requests',        icon: ClipboardList,    label: 'Duyệt yêu cầu' },
  { to: '/admin/password-resets', icon: KeyRound,         label: 'Quên Mật Khẩu' },
  { to: '/admin/logs',            icon: Activity,         label: 'Lịch sử HĐ' },
]

const NAV_STAFF = [
  { to: '/admin/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products',        icon: Package,          label: 'Sản phẩm' },
  { to: '/admin/orders',          icon: ShoppingBag,      label: 'Đơn hàng' },
  { to: '/admin/requests',        icon: ClipboardList,    label: 'Yêu cầu' },
  { to: '/admin/password-resets', icon: KeyRound,         label: 'Hỗ trợ MK' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { admin, logout } = useAdminStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const nav = admin?.role === 'admin' ? NAV_ADMIN : NAV_STAFF

  const handleLogout = () => {
    logout()
    toast.success('Đã đăng xuất')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-slate-800 border-r border-slate-700/50 flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-red-600 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-white font-bold text-sm leading-none">ITechZone</p>
              <p className="text-slate-400 text-xs mt-0.5">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Role badge */}
        {sidebarOpen && (
          <div className="px-4 py-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${admin?.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {admin?.role === 'admin' ? '👑 Admin' : '🧑‍💼 Nhân viên'}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {nav.map(item => (
            <NavLink
              key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`
              }
            >
              <item.icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && <ChevronRight size={14} className="ml-auto opacity-40" />}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-slate-700/50">
          {sidebarOpen && (
            <div className="px-3 py-2 mb-2">
              <p className="text-white text-sm font-medium truncate">{admin?.name}</p>
              <p className="text-slate-400 text-xs truncate">{admin?.email}</p>
            </div>
          )}
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors mb-1">
            <Home size={18} className="flex-shrink-0" />
            {sidebarOpen && 'Về trang chủ ↗'}
          </a>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-slate-800/50 border-b border-slate-700/50 flex items-center px-6 gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="text-white font-semibold text-sm ml-auto">
            Xin chào, <span className="text-red-400">{admin?.name}</span>
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
