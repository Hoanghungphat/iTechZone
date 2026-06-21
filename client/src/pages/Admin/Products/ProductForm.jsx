/**
 * pages/Admin/Products/ProductForm.jsx — Form thêm/sửa sản phẩm
 */
import { useState } from 'react'
import { X, Package, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createProduct, updateProduct } from '@/services/adminService'

const CATEGORIES = [
  { value: 'dien-thoai',    label: 'Điện thoại' },
  { value: 'may-tinh-bang', label: 'Máy tính bảng' },
  { value: 'phu-kien',      label: 'Phụ kiện' },
]

const BRANDS_MAP = {
  'dien-thoai':    ['apple', 'samsung', 'xiaomi', 'oppo', 'vivo'],
  'may-tinh-bang': ['apple', 'samsung', 'xiaomi'],
  'phu-kien':      ['apple', 'samsung', 'anker', 'baseus'],
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-slate-300 text-xs font-medium mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

const INPUT = "w-full px-3 py-2.5 bg-slate-700/60 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"

export default function ProductForm({ product, onClose, onSuccess }) {
  const isEdit = !!product
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:          product?.name          || '',
    category:      product?.category      || 'dien-thoai',
    brand:         product?.brand         || '',
    brandName:     product?.brandName     || '',
    price:         product?.price         || '',
    originalPrice: product?.originalPrice || '',
    stock:         product?.stock         ?? '',
    description:   product?.description   || '',
    images:        product?.images?.length ? product.images : (product?.image ? [product.image] : ['']),
    thumbnail:     product?.thumbnail     || '',
    status:        product?.status        || 'active',
    isNew:         product?.isNew         ?? false,
    isBestseller:  product?.isBestseller  ?? false,
    isFlashSale:   product?.isFlashSale   ?? false,
    isFeatured:    product?.isFeatured    ?? false,
    variants:      Array.isArray(product?.variants) ? product.variants : [],
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.category) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        price:         Number(form.price),
        originalPrice: Number(form.originalPrice || form.price),
        stock:         Number(form.stock),
        images:        form.images.filter(url => url.trim() !== ''),
        image:         form.images.find(url => url.trim() !== '') || '',
        // Convert số trong từng variant
        variants:      form.variants
          .filter(v => v.color.trim() !== '')
          .map(v => ({
            ...v,
            price:         Number(v.price) || 0,
            originalPrice: Number(v.originalPrice) || Number(v.price) || 0,
            stock:         Number(v.stock) || 0,
          })),
      }
      if (isEdit) {
        await updateProduct(product.id, payload)
        toast.success('Cập nhật sản phẩm thành công!')
      } else {
        await createProduct(payload)
        toast.success('Thêm sản phẩm thành công!')
      }
      onSuccess()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-xl h-full bg-slate-800 border-l border-slate-700 overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50 sticky top-0 bg-slate-800 z-10">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 flex items-center justify-center">
            <Package size={16} className="text-red-400" />
          </div>
          <h2 className="text-white font-bold">{isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 px-6 py-6 space-y-4">
          <Field label="Tên sản phẩm *">
            <input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="iPhone 16 Pro Max 256GB" required />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Danh mục *">
              <select className={INPUT} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Thương hiệu *">
              <select className={INPUT} value={form.brand} onChange={e => { set('brand', e.target.value); set('brandName', e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)) }}>
                <option value="">-- Chọn --</option>
                {(BRANDS_MAP[form.category] || []).map(b => (
                  <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Giá bán (₫) *">
              <input className={INPUT} type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="15000000" required />
            </Field>
            <Field label="Giá gốc (₫)">
              <input className={INPUT} type="number" min="0" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} placeholder="17000000" />
            </Field>
            <Field label="Tồn kho">
              <input className={INPUT} type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="50" />
            </Field>
          </div>

          <Field label="Ảnh thumbnail (URL)">
            <input className={INPUT} value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} placeholder="https://..." />
          </Field>

          <Field label="Ảnh sản phẩm (từng dòng 1 URL)">
            <div className="space-y-2">
              {form.images.map((url, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className={INPUT}
                    value={url}
                    onChange={e => {
                      const next = [...form.images]
                      next[idx] = e.target.value
                      set('images', next)
                    }}
                    placeholder={`URL ảnh ${idx + 1}`}
                  />
                  <button type="button"
                    onClick={() => set('images', form.images.filter((_, i) => i !== idx))}
                    className="p-2.5 rounded-xl bg-slate-700 hover:bg-red-600/30 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button"
                onClick={() => set('images', [...form.images, ''])}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 text-xs transition-colors w-full justify-center">
                <Plus size={14} /> Thêm URL ảnh
              </button>
            </div>
          </Field>

          <Field label="Mô tả">
            <textarea className={INPUT + ' resize-none'} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Mô tả sản phẩm..." />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Trạng thái">
              <select className={INPUT} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Đang bán</option>
                <option value="inactive">Ẩn</option>
              </select>
            </Field>
          </div>

          {/* Badges */}
          <div>
            <label className="text-slate-300 text-xs font-medium mb-2 block">Tags hiển thị</label>
            <div className="grid grid-cols-2 gap-2">
              {[['isNew', 'Hàng mới'], ['isBestseller', 'Bán chạy'], ['isFlashSale', 'Flash sale'], ['isFeatured', 'Nổi bật']].map(([k, lbl]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)}
                    className="rounded text-red-500" />
                  <span className="text-slate-300 text-sm">{lbl}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Variants - Màu sắc & Dung lượng */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-300 text-xs font-medium">Màu sắc &amp; Phiên bản</label>
              <button type="button"
                onClick={() => set('variants', [...form.variants, { color: '', colorCode: '#000000', capacity: '', price: '', originalPrice: '', stock: '' }])}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors">
                <Plus size={12} /> Thêm phiên bản
              </button>
            </div>

            {form.variants.length === 0 && (
              <p className="text-slate-500 text-xs text-center py-3 bg-slate-700/30 rounded-xl">
                Chưa có phiên bản — sản phẩm dùng giá &amp; tồn kho cố định
              </p>
            )}

            <div className="space-y-3">
              {form.variants.map((v, idx) => (
                <div key={idx} className="bg-slate-700/40 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-medium">Phiên bản {idx + 1}</span>
                    <button type="button"
                      onClick={() => set('variants', form.variants.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-500 text-xs mb-1 block">Tên màu</label>
                      <input value={v.color}
                        onChange={e => { const next = [...form.variants]; next[idx] = { ...v, color: e.target.value }; set('variants', next) }}
                        className={INPUT} placeholder="VD: Đen" />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs mb-1 block">Mã màu</label>
                      <div className="flex gap-2">
                        <input type="color" value={v.colorCode || '#000000'}
                          onChange={e => { const next = [...form.variants]; next[idx] = { ...v, colorCode: e.target.value }; set('variants', next) }}
                          className="w-10 h-10 rounded-lg border border-slate-600 bg-slate-700 cursor-pointer flex-shrink-0" />
                        <input value={v.colorCode}
                          onChange={e => { const next = [...form.variants]; next[idx] = { ...v, colorCode: e.target.value }; set('variants', next) }}
                          className={INPUT} placeholder="#000000" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-500 text-xs mb-1 block">Dung lượng</label>
                      <input value={v.capacity}
                        onChange={e => { const next = [...form.variants]; next[idx] = { ...v, capacity: e.target.value }; set('variants', next) }}
                        className={INPUT} placeholder="VD: 128GB" />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs mb-1 block">Tồn kho</label>
                      <input type="number" min="0" value={v.stock}
                        onChange={e => { const next = [...form.variants]; next[idx] = { ...v, stock: e.target.value }; set('variants', next) }}
                        className={INPUT} placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-500 text-xs mb-1 block">Giá bán (₫)</label>
                      <input type="number" min="0" value={v.price}
                        onChange={e => { const next = [...form.variants]; next[idx] = { ...v, price: e.target.value }; set('variants', next) }}
                        className={INPUT} placeholder="15000000" />
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs mb-1 block">Giá gốc (₫)</label>
                      <input type="number" min="0" value={v.originalPrice}
                        onChange={e => { const next = [...form.variants]; next[idx] = { ...v, originalPrice: e.target.value }; set('variants', next) }}
                        className={INPUT} placeholder="17000000" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-slate-700/50">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors">
              Huỷ
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold transition-colors">
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
