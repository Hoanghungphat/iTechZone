/**
 * constants/index.js
 * Các hằng số dùng chung trong toàn bộ ứng dụng ITechZone
 */

// ================================
// API CONFIG
// ================================
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ================================
// APP INFO
// ================================
export const APP_NAME = 'ITechZone'
export const APP_TAGLINE = 'Nâng tầm trải nghiệm công nghệ'
export const APP_URL = 'https://itechzone.vn'

// ================================
// ROUTES
// ================================
export const ROUTES = {
  HOME:           '/',
  PHONES:         '/dien-thoai',
  TABLETS:        '/may-tinh-bang',
  PRODUCT_DETAIL: '/san-pham/:slug',
  SEARCH:         '/tim-kiem',
  CART:           '/gio-hang',
  CHECKOUT:       '/thanh-toan',
  LOGIN:          '/dang-nhap',
  REGISTER:       '/dang-ky',
  PROFILE:        '/tai-khoan',
  ORDERS:         '/tai-khoan/don-hang',
  NOT_FOUND:      '*',
}

// ================================
// PRODUCT CATEGORIES
// ================================
export const CATEGORIES = [
  {
    id:    'dien-thoai',
    name:  'Điện thoại',
    slug:  'dien-thoai',
    icon:  'Smartphone',
    route: '/dien-thoai',
    description: 'Điện thoại thông minh cao cấp',
    color: '#e51c1c',
  },
  {
    id:    'may-tinh-bang',
    name:  'Máy tính bảng',
    slug:  'may-tinh-bang',
    icon:  'Tablet',
    route: '/may-tinh-bang',
    description: 'Máy tính bảng đa năng',
    color: '#1a56db',
  },
]

// ================================
// PHONE BRANDS
// ================================
export const PHONE_BRANDS = [
  { id: 'apple',   name: 'Apple',   logo: '/brands/apple.svg' },
  { id: 'samsung', name: 'Samsung', logo: '/brands/samsung.svg' },
  { id: 'xiaomi',  name: 'Xiaomi',  logo: '/brands/xiaomi.svg' },
  { id: 'oppo',    name: 'OPPO',    logo: '/brands/oppo.svg' },
  { id: 'vivo',    name: 'Vivo',    logo: '/brands/vivo.svg' },
]

// ================================
// TABLET BRANDS
// ================================
export const TABLET_BRANDS = [
  { id: 'apple',   name: 'Apple',   logo: '/brands/apple.svg' },
  { id: 'samsung', name: 'Samsung', logo: '/brands/samsung.svg' },
  { id: 'xiaomi',  name: 'Xiaomi',  logo: '/brands/xiaomi.svg' },
]

// ================================
// PRICE RANGES (VNĐ)
// ================================
export const PRICE_RANGES = [
  { id: 'under-5m',    label: 'Dưới 5 triệu',       min: 0,         max: 5_000_000 },
  { id: '5m-10m',      label: '5 - 10 triệu',        min: 5_000_000, max: 10_000_000 },
  { id: '10m-15m',     label: '10 - 15 triệu',       min: 10_000_000, max: 15_000_000 },
  { id: '15m-20m',     label: '15 - 20 triệu',       min: 15_000_000, max: 20_000_000 },
  { id: 'over-20m',    label: 'Trên 20 triệu',       min: 20_000_000, max: Infinity },
]

// ================================
// RAM OPTIONS (GB)
// ================================
export const RAM_OPTIONS = [4, 6, 8, 12, 16]

// ================================
// STORAGE OPTIONS (GB)
// ================================
export const STORAGE_OPTIONS = [64, 128, 256, 512, 1024]

// ================================
// SORT OPTIONS
// ================================
export const SORT_OPTIONS = [
  { value: 'default',     label: 'Mặc định' },
  { value: 'price-asc',   label: 'Giá thấp → cao' },
  { value: 'price-desc',  label: 'Giá cao → thấp' },
  { value: 'name-asc',    label: 'A → Z' },
  { value: 'name-desc',   label: 'Z → A' },
  { value: 'newest',      label: 'Mới nhất' },
  { value: 'bestseller',  label: 'Bán chạy nhất' },
]

// ================================
// PAGINATION
// ================================
export const ITEMS_PER_PAGE = 12

// ================================
// LOCAL STORAGE KEYS
// ================================
export const STORAGE_KEYS = {
  CART:        'itechzone_cart',
  AUTH_TOKEN:  'itechzone_token',
  USER:        'itechzone_user',
  THEME:       'itechzone_theme',
  WISHLIST:    'itechzone_wishlist',
}

// ================================
// ORDER STATUS
// ================================
export const ORDER_STATUS = {
  PENDING:    { value: 'pending',    label: 'Chờ xác nhận', color: '#854d0e', bg: '#fef9c3' },
  CONFIRMED:  { value: 'confirmed',  label: 'Đã xác nhận',  color: '#1e40af', bg: '#dbeafe' },
  SHIPPING:   { value: 'shipping',   label: 'Đang giao',     color: '#3730a3', bg: '#e0e7ff' },
  DELIVERED:  { value: 'delivered',  label: 'Đã giao',       color: '#166534', bg: '#dcfce7' },
  CANCELLED:  { value: 'cancelled',  label: 'Đã hủy',        color: '#991b1b', bg: '#fee2e2' },
}

// ================================
// PAYMENT METHODS
// ================================
export const PAYMENT_METHODS = [
  { id: 'cod',      name: 'Thanh toán khi nhận hàng (COD)',  icon: 'Truck' },
  { id: 'banking',  name: 'Chuyển khoản ngân hàng (VietQR)', icon: 'Building2' },
]

// ================================
// NAV LINKS (Header)
// ================================
export const NAV_LINKS = [
  { label: 'Điện thoại',    route: ROUTES.PHONES,  hasMenu: true },
  { label: 'Máy tính bảng', route: ROUTES.TABLETS, hasMenu: true },
]

// ================================
// FOOTER LINKS
// ================================
export const FOOTER_LINKS = {
  company: [
    { label: 'Giới thiệu',       href: '#' },
    { label: 'Tuyển dụng',       href: '#' },
    { label: 'Tin tức',          href: '#' },
    { label: 'Hệ thống cửa hàng', href: '#' },
  ],
  support: [
    { label: 'Chính sách bảo hành', href: '#' },
    { label: 'Chính sách đổi trả',  href: '#' },
    { label: 'Hướng dẫn mua hàng',  href: '#' },
    { label: 'Tra cứu đơn hàng',    href: '#' },
  ],
  contact: {
    hotline:  '1800 6789',
    email:    'hotro@itechzone.vn',
    address:  '123 Nguyễn Huệ, Q.1, TP.HCM',
    hours:    '8:00 - 22:00 (Tất cả các ngày)',
  },
  social: [
    { name: 'Facebook',  href: '#', icon: 'Facebook' },
    { name: 'YouTube',   href: '#', icon: 'Youtube' },
    { name: 'Instagram', href: '#', icon: 'Instagram' },
    { name: 'TikTok',    href: '#', icon: 'Music' },
  ],
}
