/**
 * pages/Phones/index.jsx
 * Trang danh sách điện thoại với bộ lọc và phân trang
 */
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X, Smartphone } from 'lucide-react'

import ProductGrid from '@/components/product/ProductGrid'
import ProductFilter from '@/components/product/ProductFilter'
import ProductSort from '@/components/product/ProductSort'
import Pagination from '@/components/common/Pagination'
import Breadcrumb from '@/components/common/Breadcrumb'
import { getProducts } from '@/services/productService'
import { PHONE_BRANDS, ITEMS_PER_PAGE } from '@/constants'

export default function Phones() {
  const [searchParams] = useSearchParams()
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [showMobileFilter, setShowMobileFilter] = useState(false)

  const [filters, setFilters] = useState({
    brands:   searchParams.get('brand') ? [searchParams.get('brand')] : [],
    priceMin: undefined,
    priceMax: undefined,
    rams:     [],
    storages: [],
  })
  const [sort, setSort] = useState('default')
  const [page, setPage] = useState(1)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProducts({
        category: 'dien-thoai',
        filters,
        sort,
        page,
        perPage: ITEMS_PER_PAGE,
      })
      setProducts(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters, sort, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }, [])

  const handleReset = useCallback(() => {
    setFilters({ brands: [], priceMin: undefined, priceMax: undefined, rams: [], storages: [] })
    setSort('default')
    setPage(1)
  }, [])

  const handlePageChange = (p) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-dark-900 border-b border-gray-100 dark:border-dark-800 py-4">
        <div className="container-custom">
          <Breadcrumb items={[{ label: 'Điện thoại', href: '/dien-thoai' }]} />
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 py-10">
        <div className="container-custom text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Smartphone size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black">Điện thoại chính hãng</h1>
              <p className="text-blue-100 mt-1">
                Apple, Samsung, Xiaomi, Oppo, Vivo — {total > 0 ? `${total} sản phẩm` : ''}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex gap-6">
          {/* Sidebar bộ lọc — Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProductFilter
              brands={PHONE_BRANDS}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
              type="phone"
            />
          </aside>

          {/* Nội dung chính */}
          <div className="flex-1 min-w-0">
            {/* Thanh sắp xếp + Mobile filter button */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 mb-6
                            border border-gray-100 dark:border-dark-700
                            flex items-center justify-between gap-3">
              <button
                onClick={() => setShowMobileFilter(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl
                           border border-gray-200 dark:border-dark-600
                           bg-white dark:bg-dark-700 text-sm font-medium
                           text-gray-700 dark:text-gray-300"
              >
                <SlidersHorizontal size={16} /> Bộ lọc
              </button>
              <ProductSort value={sort} onChange={(v) => { setSort(v); setPage(1) }} total={total} />
            </div>

            {/* Active filters */}
            {(filters.brands.length > 0 || filters.priceMin !== undefined) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.brands.map(b => (
                  <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                                          bg-primary-50 dark:bg-primary-950 text-primary text-xs font-semibold">
                    {PHONE_BRANDS.find(br => br.id === b)?.name || b}
                    <button onClick={() => handleFilterChange('brands', filters.brands.filter(x => x !== b))}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Lưới sản phẩm */}
            <ProductGrid products={products} loading={loading}
              emptyTitle="Không tìm thấy sản phẩm"
              emptyDesc="Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác."
            />

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="mt-10">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay bộ lọc trên mobile */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-modal flex lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileFilter(false)} />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.28 }}
            className="relative w-80 bg-white dark:bg-dark-900 h-full overflow-y-auto p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 dark:text-white">Bộ lọc</h2>
              <button onClick={() => setShowMobileFilter(false)}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
                <X size={18} />
              </button>
            </div>
            <ProductFilter
              brands={PHONE_BRANDS}
              filters={filters}
              onFilterChange={(k, v) => { handleFilterChange(k, v); setShowMobileFilter(false) }}
              onReset={() => { handleReset(); setShowMobileFilter(false) }}
              type="phone"
            />
          </motion.div>
        </div>
      )}
    </div>
  )
}
