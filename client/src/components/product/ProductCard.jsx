/**
 * product/ProductCard.jsx
 * Card sản phẩm hiện đại với hover effects và animations
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, Heart, Zap, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'

import StarRating from '@/components/common/StarRating'
import Badge from '@/components/common/Badge'
import { useAddToCart } from '@/hooks/useAddToCart'
import { formatPrice, calcDiscount } from '@/utils/format'
import { formatSoldCount } from '@/utils/format'

export default function ProductCard({ product, index = 0 }) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { addToCart } = useAddToCart()

  if (!product) return null

  const discount = product.discount || calcDiscount(product.originalPrice, product.price)

  // Thêm vào giỏ hàng — guest cũng thêm được, chỉ chặn khi thanh toán
  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, 1)
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`, {
      icon: '🛒',
      duration: 2000,
    })
  }

  // Wishlist (mock)
  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
    toast.success(isWishlisted ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích', {
      icon: isWishlisted ? '💔' : '❤️',
      duration: 1500,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="h-full"
    >
      <Link to={`/san-pham/${product.slug}`} className="block group h-full">
        <div className="relative bg-white dark:bg-dark-800 rounded-2xl overflow-hidden
                        border border-gray-100 dark:border-dark-700
                        shadow-card hover:shadow-card-hover
                        transition-all duration-300 hover:-translate-y-1
                        flex flex-col h-full">

          {/* === IMAGE WRAPPER === */}
          <div className="relative overflow-hidden bg-gray-50 dark:bg-dark-700/50" style={{ aspectRatio: '1' }}>
            <img
              src={imageError ? 'https://via.placeholder.com/400x400?text=No+Image' : product.thumbnail}
              alt={product.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-contain p-4
                         transition-transform duration-500 ease-out
                         group-hover:scale-110"
              loading="lazy"
            />

            {/* === BADGES === */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.isNew && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-lg">MỚI</span>
              )}
              {product.isBestseller && (
                <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-lg">HOT</span>
              )}
              {product.isFlashSale && (
                <span className="px-2 py-0.5 bg-yellow-400 text-dark-900 text-xs font-bold rounded-lg flex items-center gap-0.5">
                  <Zap size={10} fill="currentColor" />SALE
                </span>
              )}
            </div>

            {/* Discount badge */}
            {discount > 0 && (
              <div className="absolute top-3 right-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold leading-none">-{discount}%</span>
                </div>
              </div>
            )}

            {/* === HOVER ACTIONS === */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5
                            transition-colors duration-300 flex items-end justify-center pb-3">
              <div className="flex gap-2 opacity-0 group-hover:opacity-100
                              translate-y-4 group-hover:translate-y-0
                              transition-all duration-300">
                {/* Quick view */}
                <button
                  className="w-9 h-9 bg-white dark:bg-dark-700 rounded-xl flex items-center justify-center
                             shadow-md hover:bg-gray-50 dark:hover:bg-dark-600
                             text-gray-700 dark:text-gray-300 transition-colors"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                  title="Xem nhanh"
                >
                  <Eye size={15} />
                </button>

                {/* Wishlist */}
                <button
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-colors
                    ${isWishlisted
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-primary dark:hover:bg-dark-600'
                    }`}
                  onClick={handleWishlist}
                  title="Yêu thích"
                >
                  <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          </div>

          {/* === CONTENT === */}
          <div className="p-4 flex flex-col flex-1">
            {/* Brand */}
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
              {product.brandName}
            </p>

            {/* Product name — min-h giữ đủ 2 dòng để các card thẳng hàng */}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug mb-2
                           line-clamp-2 min-h-[2.5rem]
                           group-hover:text-primary-700 dark:group-hover:text-primary-400
                           transition-colors duration-200">
              {product.name}
            </h3>

            {/* Rating + Sold */}
            <div className="flex items-center justify-between mb-3">
              <StarRating rating={product.rating} size="sm" showCount={false} />
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Đã bán {formatSoldCount(product.sold)}
              </span>
            </div>

            {/* Price */}
            <div className="space-y-0.5 mb-3 mt-auto">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
              </div>
              {product.originalPrice > product.price && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Add to cart button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full flex items-center justify-center gap-2
                         py-2.5 rounded-xl text-sm font-semibold
                         bg-primary/10 text-primary
                         hover:bg-primary hover:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
            >
              <ShoppingCart size={15} />
              {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
