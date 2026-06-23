/**
 * routes/index.jsx
 * Cấu hình tất cả routes của ứng dụng
 *
 * Public Routes — ai cũng truy cập được
 * Auth Routes — chỉ khi chưa đăng nhập
 * Protected Routes — yêu cầu đăng nhập (mock)
 */
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'
import useAuthStore from '@/store/useAuthStore'
import Spinner from '@/components/common/Spinner'

// Lazy load pages — tối ưu performance
const Home          = lazy(() => import('@/pages/Home'))
const Phones        = lazy(() => import('@/pages/Phones'))
const Tablets       = lazy(() => import('@/pages/Tablets'))
const Accessories   = lazy(() => import('@/pages/Accessories'))
const ProductDetail = lazy(() => import('@/pages/ProductDetail'))
const SearchPage    = lazy(() => import('@/pages/Search'))
const CartPage      = lazy(() => import('@/pages/Cart'))
const CheckoutPage  = lazy(() => import('@/pages/Checkout'))
const LoginPage     = lazy(() => import('@/pages/Login'))
const RegisterPage  = lazy(() => import('@/pages/Register'))
const ProfilePage   = lazy(() => import('@/pages/Profile'))
const NotFound      = lazy(() => import('@/pages/NotFound'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const VerifyEmail    = lazy(() => import('@/pages/VerifyEmail'))

// Admin Panel pages
const AdminLayout    = lazy(() => import('@/pages/Admin/Layout'))
const AdminLogin     = lazy(() => import('@/pages/Admin/Login'))
const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard'))
const AdminProducts  = lazy(() => import('@/pages/Admin/Products'))
const AdminUsers     = lazy(() => import('@/pages/Admin/Users'))
const AdminOrders    = lazy(() => import('@/pages/Admin/Orders'))
const AdminRequests  = lazy(() => import('@/pages/Admin/Requests'))
const AdminStaff     = lazy(() => import('@/pages/Admin/Staff'))
const AdminLogs      = lazy(() => import('@/pages/Admin/AuditLog'))

// Loading fallback khi lazy load
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" className="text-primary" />
        <p className="text-sm text-gray-400">Đang tải...</p>
      </div>
    </div>
  )
}

// Protected Route wrapper — redirect nếu chưa login
function ProtectedRoute({ children }) {
  const { token } = useAuthStore()
  if (!token) {
    return <Navigate to="/dang-nhap" replace />
  }
  return children
}

// Auth Route wrapper — redirect nếu đã login
function AuthRoute({ children }) {
  const { token } = useAuthStore()
  if (token) {
    return <Navigate to="/" replace />
  }
  return children
}

// Admin Route wrapper — chỉ cho admin/staff
function AdminRoute({ children }) {
  const admin = JSON.parse(localStorage.getItem('itechzone_admin') || '{}')
  const token = admin?.state?.token
  if (!token) return <Navigate to="/admin/login" replace />
  return children
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ================================
            PUBLIC ROUTES — MainLayout
            ================================ */}
        <Route element={<MainLayout />}>
          <Route index path="/" element={<Home />} />
          <Route path="/dien-thoai" element={<Phones />} />
          <Route path="/may-tinh-bang" element={<Tablets />} />
          <Route path="/phu-kien" element={<Accessories />} />
          <Route path="/san-pham/:slug" element={<ProductDetail />} />
          <Route path="/tim-kiem" element={<SearchPage />} />
          <Route path="/gio-hang" element={<CartPage />} />

          {/* Protected routes — yêu cầu đăng nhập */}
          <Route path="/thanh-toan" element={
            <ProtectedRoute><CheckoutPage /></ProtectedRoute>
          } />
          <Route path="/tai-khoan" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/tai-khoan/don-hang" element={
            <ProtectedRoute><ProfilePage defaultTab="orders" /></ProtectedRoute>
          } />

          {/* 404 — Không tìm thấy trang */}
          <Route path="*" element={<NotFound />} />
          <Route path="/quen-mat-khau" element={<ForgotPassword />} />
          <Route path="/xac-minh-email"  element={<VerifyEmail />} />
        </Route>

        {/* ================================
            AUTH ROUTES — AuthLayout
            ================================ */}
        <Route element={<AuthLayout />}>
          <Route path="/dang-nhap" element={
            <AuthRoute><LoginPage /></AuthRoute>
          } />
          <Route path="/dang-ky" element={
            <AuthRoute><RegisterPage /></AuthRoute>
          } />
        </Route>

        {/* ================================
            ADMIN ROUTES — AdminLayout
            ================================ */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products"  element={<AdminProducts />} />
          <Route path="users"     element={<AdminUsers />} />
          <Route path="orders"    element={<AdminOrders />} />
          <Route path="requests"  element={<AdminRequests />} />
          <Route path="staff"     element={<AdminStaff />} />
          <Route path="logs"      element={<AdminLogs />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
