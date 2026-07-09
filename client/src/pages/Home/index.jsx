/**
 * pages/Home/index.jsx
 * Trang chủ ITechZone — Hero Banner + Các section sản phẩm
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Smartphone, Tablet, Zap, Shield, Truck, Star, ChevronRight } from 'lucide-react'

import ProductSlider from '@/components/product/ProductSlider'
import ProductCard from '@/components/product/ProductCard'

import { SkeletonGrid } from '@/components/ui/SkeletonCard'

import {
  getFeaturedProducts,
  getBestsellerProducts,
  getNewProducts,
  getAccessoryProducts,
} from '@/services/productService'
import { formatPrice } from '@/utils/format'
import { ROUTES } from '@/constants'
import { getPublicBanners } from '@/services/bannerService'




// ============================================
// HERO BANNER
// ============================================
function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState([])
  const [loadingSlides, setLoadingSlides] = useState(true)

  useEffect(() => {
    getPublicBanners()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data ?? [])
        setSlides(list)
      })
      .catch(() => {})
      .finally(() => setLoadingSlides(false))
  }, [])

  useEffect(() => {
    if (slides.length === 0) return
    const timer = setInterval(() =>
      setCurrentSlide(p => (p + 1) % slides.length)
    , 5000)
    return () => clearInterval(timer)
  }, [slides])

  if (loadingSlides || slides.length === 0) {
    return <div className="min-h-[560px] bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 animate-pulse" />
  }

  const slide = slides[currentSlide]

  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${slide.gradient} min-h-[560px] md:min-h-[620px] flex items-center transition-all duration-700`}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl -translate-x-1/2 -translate-y-1/2"
             style={{ background: slide.accent }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-5 blur-2xl"
             style={{ background: slide.accent }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-5"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="container-custom relative z-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Content */}
          <motion.div
            key={currentSlide + 'text'}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-white"
          >
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold uppercase tracking-widest border"
                 style={{ borderColor: slide.accent + '60', background: slide.accent + '20', color: '#fff' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: slide.accent }} />
              {slide.tag}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black leading-tight mb-4">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-300 mb-8">{slide.subtitle}</p>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-3xl font-black" style={{ color: slide.accent }}>
                {formatPrice(slide.price)}
              </span>
              <span className="text-gray-500 line-through text-lg">
                {formatPrice(slide.originalPrice)}
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                to={slide.href}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-base
                           shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{ background: `linear-gradient(135deg, ${slide.accent}, ${slide.accent}cc)` }}
              >
                {slide.ctaText || slide.cta}
                <ArrowRight size={18} />
              </Link>
              <Link
                to={currentSlide === 0 ? ROUTES?.PHONES || '/dien-thoai' : currentSlide === 1 ? '/dien-thoai' : '/may-tinh-bang'}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold
                           border-2 border-white/30 text-white hover:bg-white/10
                           transition-all duration-300 text-base"
              >
                Xem tất cả
              </Link>
            </div>
          </motion.div>

          {/* Right: Product image */}
          <motion.div
            key={currentSlide + 'img'}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center items-center"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full blur-3xl opacity-30 scale-75"
                   style={{ background: slide.accent }} />
              <img
                src={slide.image}
                alt={slide.title}
                onError={(e) => { e.target.style.display = 'none' }}
                className="relative z-10 w-72 h-72 md:w-96 md:h-96 object-contain drop-shadow-2xl animate-float"
              />
            </div>
          </motion.div>
        </div>

        {/* Slide indicators */}
        <div className="flex items-center gap-2 mt-10 justify-center lg:justify-start">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(i)}
              className={`transition-all duration-300 rounded-full ${
                i === currentSlide
                  ? 'w-8 h-2 opacity-100'
                  : 'w-2 h-2 opacity-40 hover:opacity-70'
              }`}
              style={{ background: i === currentSlide ? slide.accent : 'white' }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FEATURED CATEGORIES
// ============================================
function FeaturedCategories() {
  const [counts, setCounts] = useState({ 'dien-thoai': null, 'may-tinh-bang': null, 'phu-kien': null })

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [phones, tablets, accessories] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products?category=dien-thoai&limit=1`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products?category=may-tinh-bang&limit=1`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products?category=phu-kien&limit=1`).then(r => r.json()),
        ])
        setCounts({
          'dien-thoai':    phones?.data?.total    ?? null,
          'may-tinh-bang': tablets?.data?.total   ?? null,
          'phu-kien':      accessories?.data?.total ?? null,
        })
      } catch {
        // Giữ null nếu fetch lỗi
      }
    }
    fetchCounts()
  }, [])

  const formatCount = (n) => n === null ? '' : `${n} sản phẩm`

  const categories = [
    {
      title: 'Điện thoại',
      icon: Smartphone,
      href: '/dien-thoai',
      countKey: 'dien-thoai',
      desc: 'iPhone, Samsung, Xiaomi, OPPO, Vivo',
      color: 'from-primary-600 to-primary-800',
      bg: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
    },
    {
      title: 'Máy tính bảng',
      icon: Tablet,
      href: '/may-tinh-bang',
      countKey: 'may-tinh-bang',
      desc: 'iPad, Galaxy Tab, Xiaomi Pad',
      color: 'from-blue-600 to-indigo-700',
      bg: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
    },
    {
      title: 'Phụ kiện',
      icon: Zap,
      href: '/phu-kien',
      countKey: 'phu-kien',
      desc: 'Củ sạc, Dây sạc Apple, Samsung, Anker',
      color: 'from-amber-500 to-orange-600',
      bg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    },
  ]


  return (
    <section className="section">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={cat.href}
                    className={`flex items-center gap-6 p-7 rounded-3xl bg-gradient-to-br ${cat.bg}
                                border border-gray-100 dark:border-dark-700
                                hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group`}>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.color}
                                 flex items-center justify-center flex-shrink-0
                                 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <cat.icon size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cat.title}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-800 px-2 py-1 rounded-lg">
                      {formatCount(counts[cat.countKey])}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{cat.desc}</p>
                  <div className="flex items-center gap-1 text-primary text-sm font-semibold mt-2
                                  group-hover:gap-2 transition-all duration-200">
                    Xem ngay <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


// ============================================
// PRODUCT SECTION (generic)
// ============================================
function ProductSection({ title, subtitle, viewAllHref, fetchFn, fetchArgs = [] }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFn(...fetchArgs).then(data => {
      setProducts(data)
      setLoading(false)
    })
  }, [])

  return (
    <section className="section">
      <div className="container-custom">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">{title}</h2>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
          <Link
            to={viewAllHref}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-700 font-semibold transition-colors whitespace-nowrap"
          >
            Xem tất cả <ArrowRight size={15} />
          </Link>
        </div>

        {/* Products */}
        <ProductSlider products={products} loading={loading} />
      </div>
    </section>
  )
}

// ============================================
// TRUST BANNER
// ============================================
function TrustBanner() {
  const points = [
    { icon: Shield,  title: '100% Hàng chính hãng', desc: 'Cam kết không hàng giả' },
    { icon: Truck,   title: 'Giao hàng nhanh',       desc: 'Trong 2 giờ nội thành' },
    { icon: Star,    title: 'Ưu đãi độc quyền',      desc: 'Giá tốt nhất thị trường' },
  ]

  return (
    <div className="bg-primary py-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {points.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 text-white"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <p.icon size={22} />
              </div>
              <div>
                <p className="font-bold text-sm">{p.title}</p>
                <p className="text-white/70 text-xs">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// HOME PAGE
// ============================================
export default function Home() {
  return (
    <div>
      {/* Hero */}
      <HeroBanner />

      {/* Categories */}
      <FeaturedCategories />



      {/* Trust */}
      <TrustBanner />

      {/* Điện thoại nổi bật */}
      <ProductSection
        title="Điện thoại nổi bật"
        subtitle="Các mẫu điện thoại được yêu thích nhất"
        viewAllHref="/dien-thoai"
        fetchFn={getFeaturedProducts}
        fetchArgs={['dien-thoai', 8]}
      />

      {/* iPhone bán chạy */}
      <div className="bg-white dark:bg-dark-900 py-2">
        <ProductSection
          title="iPhone bán chạy nhất"
          subtitle="Apple iPhone chính hãng giá tốt"
          viewAllHref="/dien-thoai?brand=apple"
          fetchFn={getBestsellerProducts}
          fetchArgs={['apple', 6]}
        />
      </div>

      {/* Samsung nổi bật */}
      <ProductSection
        title="Samsung Galaxy nổi bật"
        subtitle="Flagship Android đỉnh cao"
        viewAllHref="/dien-thoai?brand=samsung"
        fetchFn={getBestsellerProducts}
        fetchArgs={['samsung', 6]}
      />

      {/* Máy tính bảng */}
      <div className="bg-white dark:bg-dark-900 py-2">
        <ProductSection
          title="Máy tính bảng nổi bật"
          subtitle="iPad, Galaxy Tab, Xiaomi Pad chính hãng"
          viewAllHref="/may-tinh-bang"
          fetchFn={getFeaturedProducts}
          fetchArgs={['may-tinh-bang', 6]}
        />
      </div>

      {/* Sản phẩm mới */}
      <ProductSection
        title="Sản phẩm mới nhất"
        subtitle="Cập nhật những mẫu hot nhất"
        viewAllHref="/dien-thoai"
        fetchFn={getNewProducts}
        fetchArgs={[8]}
      />

      {/* Phụ kiện */}
      <div className="bg-white dark:bg-dark-900 py-2">
        <ProductSection
          title="Phụ kiện chính hãng"
          subtitle="Củ sạc, dây sạc Apple, Samsung, Anker, Baseus"
          viewAllHref="/phu-kien"
          fetchFn={getAccessoryProducts}
          fetchArgs={[8]}
        />
      </div>
    </div>
  )
}
