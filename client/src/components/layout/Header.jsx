/**
 * layout/Header.jsx
 * Header cố định với Mega Menu, giỏ hàng, dark mode toggle
 * Thiết kế premium cho ITechZone
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ShoppingCart, User, Sun, Moon, Menu, X,
  Smartphone, Tablet, ChevronDown, LogOut,
  Package, Plug, LayoutDashboard
} from 'lucide-react'

import Logo from '@/components/common/Logo'
import CartDrawer from '@/components/cart/CartDrawer'
import useCartStore from '@/store/useCartStore'
import useThemeStore from '@/store/useThemeStore'
import useAuthStore from '@/store/useAuthStore'
import { PHONE_BRANDS, TABLET_BRANDS, ROUTES } from '@/constants'
import { getBestsellerProducts } from '@/services/productService'

// =============================================
// MEGA MENU CONFIG (không dùng mock data)
// =============================================
const MEGA_MENU_CONFIG = [
  {
    label: 'Điện thoại',
    route: ROUTES.PHONES,
    icon: Smartphone,
    brands: PHONE_BRANDS,
    category: 'dien-thoai',
    btnCls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60',
    activeCls: 'bg-blue-600 text-white shadow-md shadow-blue-500/30',
    featuredLinks: [
      { label: 'iPhone', href: `${ROUTES.PHONES}?brand=apple` },
      { label: 'Samsung Galaxy S', href: `${ROUTES.PHONES}?brand=samsung` },
      { label: 'Xiaomi 14', href: `${ROUTES.PHONES}?brand=xiaomi` },
      { label: 'OPPO Find X', href: `${ROUTES.PHONES}?brand=oppo` },
    ],
  },
  {
    label: 'Máy tính bảng',
    route: ROUTES.TABLETS,
    icon: Tablet,
    brands: TABLET_BRANDS,
    category: 'may-tinh-bang',
    btnCls: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60',
    activeCls: 'bg-violet-600 text-white shadow-md shadow-violet-500/30',
    featuredLinks: [
      { label: 'iPad Pro', href: `${ROUTES.TABLETS}?brand=apple` },
      { label: 'Galaxy Tab S', href: `${ROUTES.TABLETS}?brand=samsung` },
      { label: 'Xiaomi Pad', href: `${ROUTES.TABLETS}?brand=xiaomi` },
    ],
  },
  {
    label: 'Phụ kiện',
    route: '/phu-kien',
    icon: Plug,
    brands: [
      { id: 'apple',   name: 'Apple' },
      { id: 'samsung', name: 'Samsung' },
      { id: 'xiaomi',  name: 'Xiaomi' },
      { id: 'anker',   name: 'Anker' },
      { id: 'baseus',  name: 'Baseus' },
      { id: 'oppo',    name: 'OPPO' },
    ],
    category: 'phu-kien',
    btnCls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60',
    activeCls: 'bg-amber-500 text-white shadow-md shadow-amber-500/30',
    featuredLinks: [
      { label: 'Củ sạc Apple', href: '/phu-kien?brand=apple' },
      { label: 'Củ sạc Samsung', href: '/phu-kien?brand=samsung' },
      { label: 'Anker GaN', href: '/phu-kien?brand=anker' },
      { label: 'Baseus', href: '/phu-kien?brand=baseus' },
    ],
  },
]

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // Highlights bán chạy cho Mega Menu — lấy từ API
  const [megaHighlights, setMegaHighlights] = useState({ 'dien-thoai': [], 'may-tinh-bang': [] })
  const menuRef = useRef(null)
  const menuTimerRef = useRef(null)

  const { items, openDrawer } = useCartStore()
  const { theme, toggleTheme } = useThemeStore()
  const { user, token, logout } = useAuthStore()

  // Tính isLoggedIn trực tiếp từ state — reactive hơn getter
  const isLoggedIn = !!token && !!user

  // Avatar fallback khi không có ảnh
  const avatarUrl = user?.avatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=e51c1c&color=fff`

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const totalItems = items.reduce((s, i) => s + i.qty, 0)

  // Merge config với highlights từ API
  const MEGA_MENU = MEGA_MENU_CONFIG.map(item => ({
    ...item,
    highlights: megaHighlights[item.category] || [],
  }))

  // Lấy highlights bán chạy từ API cho Mega Menu
  useEffect(() => {
    getBestsellerProducts(null, 6)
      .then(products => {
        const phones = products.filter(p => p.category === 'dien-thoai').slice(0, 3)
        const tablets = products.filter(p => p.category === 'may-tinh-bang').slice(0, 3)
        setMegaHighlights({ 'dien-thoai': phones, 'may-tinh-bang': tablets })
      })
      .catch(() => {}) // Mega menu vẫn hiển thị nếu API lỗi
  }, [])

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setActiveMenu(null)
  }, [location.pathname])

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSearchFocused(false)
    }
  }

  const handleMenuEnter = (label) => {
    clearTimeout(menuTimerRef.current)
    setActiveMenu(label)
  }

  const handleMenuLeave = () => {
    menuTimerRef.current = setTimeout(() => setActiveMenu(null), 150)
  }

  const isActive = (route) => {
    if (route === '/') return location.pathname === '/'
    return location.pathname.startsWith(route)
  }

  return (
    <>

      {/* ============================================
          MAIN HEADER
          ============================================ */}
      <header
        className={`sticky top-0 z-header transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl shadow-lg border-b border-gray-100/50 dark:border-dark-700/50'
            : 'bg-white dark:bg-dark-900 border-b border-gray-100 dark:border-dark-800'
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center gap-4 h-[68px]">

            {/* LOGO */}
            <Logo size="md" />

            {/* === DESKTOP NAV === */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {MEGA_MENU.map((item) => (
                <div
                  key={item.label}
                  onMouseEnter={() => handleMenuEnter(item.label)}
                  onMouseLeave={handleMenuLeave}
                  className="relative"
                >
                  <Link
                    to={item.route}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                                transition-all duration-200 ${
                      isActive(item.route)
                        ? item.activeCls
                        : item.btnCls
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${activeMenu === item.label ? 'rotate-180' : ''}`}
                    />
                  </Link>

                  {/* Mega Menu Dropdown */}
                  <AnimatePresence>
                    {activeMenu === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        onMouseEnter={() => handleMenuEnter(item.label)}
                        onMouseLeave={handleMenuLeave}
                        className="absolute top-full left-0 pt-2 z-50"
                        style={{ minWidth: '640px' }}
                      >
                        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-700 p-6">
                          <div className="grid grid-cols-3 gap-6">
                            {/* Brands */}
                            <div>
                              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                                Theo hãng
                              </p>
                              <div className="space-y-1.5">
                                {item.brands.map(brand => (
                                  <Link
                                    key={brand.id}
                                    to={`${item.route}?brand=${brand.id}`}
                                    onClick={() => setActiveMenu(null)}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl
                                               text-sm text-gray-700 dark:text-gray-300
                                               hover:bg-gray-50 dark:hover:bg-dark-700
                                               hover:text-primary transition-colors"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                    {brand.name}
                                  </Link>
                                ))}
                                <Link
                                  to={item.route}
                                  onClick={() => setActiveMenu(null)}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl
                                             text-sm text-primary font-semibold
                                             hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
                                >
                                  Xem tất cả →
                                </Link>
                              </div>
                            </div>

                            {/* Featured Links */}
                            <div>
                              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                                Nổi bật
                              </p>
                              <div className="space-y-1.5">
                                {item.featuredLinks.map(link => (
                                  <Link
                                    key={link.label}
                                    to={link.href}
                                    onClick={() => setActiveMenu(null)}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl
                                               text-sm text-gray-700 dark:text-gray-300
                                               hover:bg-gray-50 dark:hover:bg-dark-700
                                               hover:text-primary transition-colors"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-dark-500" />
                                    {link.label}
                                  </Link>
                                ))}
                              </div>
                            </div>

                            {/* Highlights */}
                            <div>
                              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                                Bán chạy
                              </p>
                              <div className="space-y-2">
                                {item.highlights.map(product => (
                                  <Link
                                    key={product.id}
                                    to={`/san-pham/${product.slug}`}
                                    onClick={() => setActiveMenu(null)}
                                    className="flex items-center gap-3 p-2 rounded-xl
                                               hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group"
                                  >
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-dark-600 overflow-hidden flex-shrink-0">
                                      <img src={product.thumbnail} alt={product.name}
                                           className="w-full h-full object-contain p-1" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200
                                                     line-clamp-1 group-hover:text-primary transition-colors">
                                        {product.name}
                                      </p>
                                      <p className="text-xs text-primary font-bold mt-0.5">
                                        {new Intl.NumberFormat('vi-VN').format(product.price)}₫
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* === SEARCH BAR === */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Tìm kiếm điện thoại, máy tính bảng..."
                  className={`w-full pl-11 pr-4 py-2.5 rounded-2xl text-sm
                    bg-gray-50 dark:bg-dark-800
                    text-gray-900 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-500
                    border transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-dark-700
                    ${searchFocused
                      ? 'border-primary-400 shadow-primary'
                      : 'border-gray-200 dark:border-dark-700'
                    }`}
                />
                <button
                  type="submit"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  <Search size={17} />
                </button>
              </form>
            </div>

            {/* === ACTION BUTTONS === */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400
                           hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
              >
                {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
              </button>

              {/* User account */}
              {isLoggedIn ? (
                <div className="relative group hidden md:block">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl
                                     text-sm font-medium text-gray-700 dark:text-gray-300
                                     hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
                    <img src={avatarUrl} alt={user?.name}
                         className="w-7 h-7 rounded-full object-cover" />
                    <span className="max-w-[80px] truncate">{user?.name}</span>
                  </button>
                  <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-50">
                    <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-700 p-2 min-w-[180px]">
                      {/* Nút trang quản lý — chỉ admin/staff */}
                      {(user?.role === 'admin' || user?.role === 'staff') && (
                        <>
                          <Link to="/admin"
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 transition-colors">
                            <LayoutDashboard size={15} /> Trang quản lý
                          </Link>
                          <hr className="my-1 border-gray-100 dark:border-dark-700" />
                        </>
                      )}
                      <Link to="/tai-khoan"
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-primary transition-colors">
                        <User size={15} /> Tài khoản
                      </Link>
                      <Link to="/tai-khoan/don-hang"
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-primary transition-colors">
                        <Package size={15} /> Đơn hàng
                      </Link>
                      <hr className="my-1 border-gray-100 dark:border-dark-700" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 w-full transition-colors"
                      >
                        <LogOut size={15} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to={ROUTES.LOGIN}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl
                             text-sm font-semibold
                             text-gray-700 dark:text-gray-300
                             hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                >
                  <User size={18} />
                  <span>Đăng nhập</span>
                </Link>
              )}

              {/* Cart button */}
              <button
                onClick={openDrawer}
                className="relative p-2.5 rounded-xl text-gray-600 dark:text-gray-300
                           hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
              >
                <ShoppingCart size={21} />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white
                               text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </motion.span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400
                           hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors lg:hidden"
              >
                {mobileOpen ? <X size={21} /> : <Menu size={21} />}
              </button>
            </div>
          </div>

          {/* === MOBILE SEARCH === */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm
                           bg-gray-50 dark:bg-dark-800
                           border border-gray-200 dark:border-dark-700
                           text-gray-900 dark:text-gray-100
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </form>
          </div>
        </div>

        {/* === MOBILE MENU === */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-gray-100 dark:border-dark-800 lg:hidden"
            >
              <div className="container-custom py-4 space-y-1">
                {MEGA_MENU.map(item => (
                  <div key={item.label}>
                    <Link
                      to={item.route}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl
                                 text-sm font-semibold text-gray-800 dark:text-gray-200
                                 hover:bg-gray-50 dark:hover:bg-dark-800 hover:text-primary transition-colors"
                    >
                      <item.icon size={18} />
                      {item.label}
                    </Link>
                  </div>
                ))}

                <div className="border-t border-gray-100 dark:border-dark-800 pt-3 mt-3">
                  {isLoggedIn ? (
                    <>
                      {/* Nút trang quản lý — chỉ admin/staff */}
                      {(user?.role === 'admin' || user?.role === 'staff') && (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10">
                          <LayoutDashboard size={18} /> Trang quản lý
                        </Link>
                      )}
                      <Link to="/tai-khoan" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-800">
                        <User size={18} /> Tài khoản
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 w-full hover:bg-red-50 dark:hover:bg-red-950/30">
                        <LogOut size={18} /> Đăng xuất
                      </button>
                    </>
                  ) : (
                    <Link to={ROUTES.LOGIN} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primary hover:bg-primary-50 dark:hover:bg-primary-950">
                      <User size={18} /> Đăng nhập / Đăng ký
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  )
}
