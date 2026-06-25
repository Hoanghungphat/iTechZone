/**
 * pages/ProductDetail/index.jsx
 * Trang chi tiết sản phẩm với gallery, specs, reviews, related products
 */
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Zap, Shield, Truck, Heart,
  ChevronLeft, ChevronRight, Check, Star,
  Smartphone, ArrowLeft, Share2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import StarRating from '@/components/common/StarRating'
import Badge from '@/components/common/Badge'
import Breadcrumb from '@/components/common/Breadcrumb'
import ProductSlider from '@/components/product/ProductSlider'
import ErrorState from '@/components/ui/ErrorState'
import Spinner from '@/components/common/Spinner'
import { useAddToCart } from '@/hooks/useAddToCart'
import useAuthStore from '@/store/useAuthStore'
import { getProductBySlug, getRelatedProducts } from '@/services/productService'
import { getReviews, createReview } from '@/services/reviewService'
import { formatPrice, formatDate } from '@/utils/format'

// ============================================
// IMAGE GALLERY
// ============================================
function ImageGallery({ images = [], productName }) {
  // Đảm bảo images luôn là array hợp lệ
  const safeImages = Array.isArray(images) && images.length > 0 ? images : []
  const [activeIdx, setActiveIdx] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  const nextImg = () => setActiveIdx(p => (p + 1) % safeImages.length)
  const prevImg = () => setActiveIdx(p => (p - 1 + safeImages.length) % safeImages.length)

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div
        className="relative rounded-3xl overflow-hidden bg-gray-50 dark:bg-dark-700 cursor-zoom-in"
        style={{ aspectRatio: '1' }}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIdx}
            src={safeImages[activeIdx] || '/placeholder.jpg'}
            alt={`${productName} - ảnh ${activeIdx + 1}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full object-contain p-8 transition-transform duration-200"
            style={zoomed ? {
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
              transform: 'scale(1.8)',
            } : {}}
          />
        </AnimatePresence>

        {safeImages.length > 1 && (
          <>
            <button onClick={prevImg}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-white/90 dark:bg-dark-800/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={nextImg}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-white/90 dark:bg-dark-800/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {safeImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${
                i === activeIdx
                  ? 'border-primary shadow-primary'
                  : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// SPECS TABLE
// ============================================
function SpecsTable({ specs }) {
  // Không có specs → hiển thị thông báo
  if (!specs || typeof specs !== 'object' || Object.keys(specs).length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-800">
        <p className="text-gray-400 dark:text-gray-500 text-sm">Chưa có thông số kỹ thuật</p>
      </div>
    )
  }

  const labels = {
    display:     'Màn hình',
    cpu:         'Vi xử lý',
    ram:         'RAM',
    storage:     'Bộ nhớ trong',
    battery:     'Pin',
    camera:      'Camera sau',
    os:          'Hệ điều hành',
    sim:         'SIM',
    color:       'Màu sắc',
    weight:      'Khối lượng',
    connectivity:'Kết nối',
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-dark-700">
      {Object.entries(specs).map(([key, value], i) => (
        <div key={key} className={`flex px-5 py-3.5 text-sm ${
          i % 2 === 0
            ? 'bg-gray-50 dark:bg-dark-800/50'
            : 'bg-white dark:bg-dark-800'
        }`}>
          <span className="text-gray-500 dark:text-gray-400 w-40 flex-shrink-0 font-medium">
            {labels[key] || key}
          </span>
          <span className="text-gray-900 dark:text-white font-semibold">{value}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================
// STAR PICKER (interactive)
// ============================================
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110">
          <Star size={28}
            className={(hovered || value) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
        </button>
      ))}
    </div>
  )
}

// ============================================
// REVIEW SECTION (real API)
// ============================================
function ReviewSection({ productId, rating: initialRating, reviewCount: initialCount }) {
  const { user } = useAuthStore()
  const [reviews, setReviews]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [myRating, setMyRating]     = useState(5)
  const [comment, setComment]       = useState('')
  const [hasReviewed, setHasReviewed] = useState(false)

  const loadReviews = async () => {
    try {
      setLoading(true)
      const data = await getReviews(productId)
      const list = Array.isArray(data) ? data : (data?.reviews ?? [])
      setReviews(list)
      if (user) setHasReviewed(list.some(r => r.userId === user.id))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadReviews() }, [productId])

  // Tính rating và phân phối thật từ reviews đã load
  const realRating = reviews.length
    ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : (initialRating || 0)

  const displayCount = initialCount || reviews.length

  const dist = [5,4,3,2,1].map(s => {
    const count = reviews.filter(r => r.rating === s).length
    return { star: s, count, pct: reviews.length > 0 ? Math.round(count / reviews.length * 100) : 0 }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) { toast.error('Vui lòng nhập nội dung đánh giá'); return }
    setSubmitting(true)
    try {
      await createReview(productId, { rating: myRating, comment: comment.trim() })
      toast.success('Cảm ơn bạn đã đánh giá! 🎉')
      setComment('')
      setMyRating(5)
      setHasReviewed(true)
      loadReviews()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể gửi đánh giá')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      {/* Rating summary */}
      <div className="flex items-center gap-8 p-6 bg-gray-50 dark:bg-dark-800 rounded-2xl">
        <div className="text-center">
          <div className="text-5xl font-black text-gray-900 dark:text-white">{realRating}</div>
          <StarRating rating={realRating} size="md" showCount={false} className="mt-1" />
          <p className="text-xs text-gray-500 mt-1">{displayCount.toLocaleString('vi-VN')} đánh giá</p>
        </div>
        <div className="flex-1 space-y-2">
          {dist.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-3">{star}</span>
              <Star size={12} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-dark-700 overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form viết đánh giá */}
      {user ? (
        hasReviewed ? (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-800">
            <Check size={16} className="text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">Bạn đã đánh giá sản phẩm này rồi.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Viết đánh giá của bạn</h3>
            <div>
              <p className="text-sm text-gray-500 mb-2">Chọn số sao:</p>
              <StarPicker value={myRating} onChange={setMyRating} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nội dung đánh giá</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-700 disabled:opacity-60 transition shadow-primary">
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </form>
        )
      ) : (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
          <Link to="/dang-nhap" className="font-bold underline">Đăng nhập</Link> để viết đánh giá sản phẩm.
        </div>
      )}

      {/* Danh sách đánh giá */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-dark-700 rounded-2xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Star size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <motion.div key={review.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{review.user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{review.user?.name}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 text-xs font-medium">
                        <Check size={10} /> Đã mua
                      </span>
                    </div>
                    <StarRating rating={review.rating} size="sm" showCount={false} className="mt-0.5" />
                  </div>
                </div>
                <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-2 pl-12">{review.comment}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// PRODUCT DETAIL PAGE
// ============================================
export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)   // tên màu đang chọn
  const [selectedCapacity, setSelectedCapacity] = useState(null) // dung lượng đang chọn
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState('specs')
  const [isWishlisted, setIsWishlisted] = useState(false)

  const { addToCart } = useAddToCart()

  useEffect(() => {
    setLoading(true)
    setError(null)
    getProductBySlug(slug)
      .then(async (data) => {
        setProduct(data)
        // Khởi tạo variant mặc định (màu đầu tiên, dung lượng đầu tiên)
        if (data.variants && data.variants.length > 0) {
          setSelectedColor(data.variants[0].color)
          setSelectedCapacity(data.variants[0].capacity)
        }
        const rel = await getRelatedProducts(data.id, 6)
        setRelated(rel)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [slug])

  // ============================================
  // VARIANT LOGIC
  // ============================================
  const variants = (product?.variants) || []
  const hasVariants = variants.length > 0

  // Danh sách màu không trùng
  const uniqueColors = hasVariants
    ? [...new Map(variants.map(v => [v.color, { color: v.color, colorCode: v.colorCode }])).values()]
    : []

  // Dung lượng có sẵn cho màu đang chọn
  const availableStorages = hasVariants && selectedColor
    ? variants.filter(v => v.color === selectedColor)
    : []

  // Variant đang active
  const activeVariant = hasVariants
    ? variants.find(v => v.color === selectedColor && v.capacity === selectedCapacity) || null
    : null

  // Giá hiển thị (ưu tiên variant đang chọn)
  const displayPrice        = activeVariant ? activeVariant.price        : product?.price
  const displayOriginal     = activeVariant ? activeVariant.originalPrice: product?.originalPrice
  const displayStock        = activeVariant ? activeVariant.stock        : product?.stock
  const displayDiscount     = displayOriginal > displayPrice
    ? Math.round((1 - displayPrice / displayOriginal) * 100)
    : 0

  // Khi đổi màu → tự chọn dung lượng đầu tiên của màu đó
  const handleColorChange = (colorName) => {
    setSelectedColor(colorName)
    const firstStorage = variants.find(v => v.color === colorName)
    if (firstStorage) setSelectedCapacity(firstStorage.capacity)
  }

  // Thêm vào giỏ hàng — yêu cầu đăng nhập
  const handleAddToCart = () => {
    const itemToAdd = activeVariant
      ? { ...product, price: activeVariant.price, originalPrice: activeVariant.originalPrice,
          selectedColor, selectedCapacity,
          name: `${product.name} - ${selectedColor} ${selectedCapacity}` }
      : product
    const added = addToCart(itemToAdd, qty)
    if (added) toast.success('Đã thêm vào giỏ hàng!', { icon: '🛒' })
  }

  // Mua ngay — yêu cầu đăng nhập
  const handleBuyNow = () => {
    const itemToAdd = activeVariant
      ? { ...product, price: activeVariant.price, originalPrice: activeVariant.originalPrice,
          selectedColor, selectedCapacity,
          name: `${product.name} - ${selectedColor} ${selectedCapacity}` }
      : product
    const added = addToCart(itemToAdd, qty, false) // false = không mở drawer
    if (added) navigate('/thanh-toan')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Spinner size="lg" className="text-primary mx-auto" />
          <p className="text-sm text-gray-400">Đang tải sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container-custom py-20">
        <ErrorState
          message={error || 'Không tìm thấy sản phẩm'}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  const tabs = [
    { id: 'specs',   label: 'Thông số kỹ thuật' },
    { id: 'desc',    label: 'Mô tả sản phẩm' },
    { id: 'reviews', label: `Đánh giá (${product.reviewCount ?? 0})` },
  ]

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-dark-900 border-b border-gray-100 dark:border-dark-800 py-4">
        <div className="container-custom">
          <Breadcrumb items={[
            { label: product.category === 'dien-thoai' ? 'Điện thoại' : 'Máy tính bảng',
              href: product.category === 'dien-thoai' ? '/dien-thoai' : '/may-tinh-bang' },
            { label: product.name, href: '#' },
          ]} />
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Main product section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

          {/* Left: Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ImageGallery images={product.images} productName={product.name} />
          </motion.div>

          {/* Right: Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.isNew && <Badge label="Mới" type="new" />}
              {product.isBestseller && <Badge label="Bán chạy" type="hot" />}
              {product.isFlashSale && <Badge label="Flash Sale" type="sale" />}
              <Badge label="Hàng chính hãng" type="success" />
            </div>

            {/* Brand */}
            <p className="text-primary font-bold text-sm uppercase tracking-wider">
              {product.brandName}
            </p>

            {/* Product name */}
            <h1 className="text-2xl md:text-3xl font-display font-black text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <StarRating rating={product.rating} reviewCount={product.reviewCount} size="md" />
              <span className="text-sm text-gray-500">|</span>
              <span className="text-sm text-gray-500">Đã bán: <strong className="text-gray-700 dark:text-gray-300">{product.sold.toLocaleString('vi-VN')}</strong></span>
            </div>

            {/* Price — cập nhật theo variant */}
            <motion.div
              key={`${selectedColor}-${selectedCapacity}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="p-5 bg-gradient-to-r from-primary-50 to-rose-50 dark:from-primary-950/30 dark:to-rose-950/30 rounded-2xl"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-primary">{formatPrice(displayPrice)}</span>
                {displayOriginal > displayPrice && (
                  <span className="text-base text-gray-400 line-through">{formatPrice(displayOriginal)}</span>
                )}
                {displayDiscount > 0 && (
                  <span className="px-2 py-0.5 bg-primary text-white text-sm font-bold rounded-lg">
                    -{displayDiscount}%
                  </span>
                )}
              </div>
              {displayOriginal > displayPrice && (
                <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-1">
                  Tiết kiệm: {formatPrice(displayOriginal - displayPrice)}
                </p>
              )}
            </motion.div>

            {/* === VARIANT SELECTOR === */}
            {hasVariants && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-dark-800/60 rounded-2xl border border-gray-100 dark:border-dark-700">

                {/* Màu sắc */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Màu: <span className="text-primary font-bold">{selectedColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uniqueColors.map(({ color, colorCode }) => (
                      <motion.button
                        key={color}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleColorChange(color)}
                        className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                          selectedColor === color
                            ? 'border-primary shadow-md shadow-primary/20 bg-white dark:bg-dark-700'
                            : 'border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 hover:border-gray-300'
                        }`}
                      >
                        {/* Color circle */}
                        <span
                          className="w-5 h-5 rounded-full border border-white shadow-sm flex-shrink-0"
                          style={{ background: colorCode }}
                        />
                        <span className={selectedColor === color ? 'text-primary' : 'text-gray-600 dark:text-gray-300'}>
                          {color}
                        </span>
                        {selectedColor === color && (
                          <Check size={13} className="text-primary" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Dung lượng + Giá */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Dung lượng: <span className="text-primary font-bold">{selectedCapacity}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableStorages.map((v) => (
                      <motion.button
                        key={v.capacity}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCapacity(v.capacity)}
                        className={`flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all ${
                          selectedCapacity === v.capacity
                            ? 'border-primary bg-primary-50 dark:bg-primary-950/40 shadow-sm'
                            : 'border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 hover:border-gray-300'
                        }`}
                      >
                        <span className={`text-sm font-bold ${
                          selectedCapacity === v.capacity ? 'text-primary' : 'text-gray-800 dark:text-white'
                        }`}>
                          {v.capacity}
                        </span>
                        <span className={`text-xs mt-0.5 ${
                          selectedCapacity === v.capacity ? 'text-primary/80' : 'text-gray-400'
                        }`}>
                          {formatPrice(v.price)}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Qty */}
            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Số lượng:</p>
              <div className="flex items-center border border-gray-200 dark:border-dark-600 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors font-bold">
                  −
                </button>
                <span className="w-12 text-center font-bold text-gray-900 dark:text-white">{qty}</span>
                <button onClick={() => setQty(q => Math.min(displayStock, q + 1))}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors font-bold">
                  +
                </button>
              </div>
              <span className="text-xs text-gray-400">Còn {displayStock} sản phẩm</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm
                           border-2 border-primary text-primary hover:bg-primary hover:text-white
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ShoppingCart size={18} />
                Thêm giỏ hàng
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm
                           bg-primary text-white hover:bg-primary-700 shadow-primary
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Zap size={18} fill="currentColor" />
                Mua ngay
              </button>
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-14 flex items-center justify-center rounded-2xl border-2 transition-all ${
                  isWishlisted
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 dark:border-dark-600 text-gray-500 hover:border-primary hover:text-primary'
                }`}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Policy icons */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Shield, text: 'Bảo hành 12T' },
                { icon: Truck,  text: 'Miễn phí ship' },
                { icon: Check,  text: '100% chính hãng' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-dark-800 text-center">
                  <Icon size={18} className="text-primary" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tabs: Specs / Description / Reviews */}
        <div className="mb-16">
          {/* Tab headers */}
          <div className="flex gap-1 bg-gray-100 dark:bg-dark-800 rounded-2xl p-1.5 mb-6 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === 'specs' && (
              <motion.div key="specs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <SpecsTable specs={product.specs} />
              </motion.div>
            )}
            {activeTab === 'desc' && (
              <motion.div key="desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="prose prose-gray dark:prose-invert max-w-none p-6 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{product.description}</p>
              </motion.div>
            )}
            {activeTab === 'reviews' && (
              <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ReviewSection productId={product.id} rating={product.rating} reviewCount={product.reviewCount ?? 0} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">Sản phẩm liên quan</h2>
            </div>
            <ProductSlider products={related} />
          </div>
        )}
      </div>
    </div>
  )
}
