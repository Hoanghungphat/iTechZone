/**
 * pages/Admin/Banners/index.jsx — Quản lý Banner trang chủ
 */
import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Image, X, Check, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useAdminStore from '@/store/useAdminStore'
import { getAdminBanners, createBanner, updateBanner, deleteBanner } from '@/services/bannerService'
import { formatPrice } from '@/utils/format'
import api from '@/services/api'

const GRADIENTS = [
  { label: 'Đỏ tối', value: 'from-dark-900 via-dark-800 to-dark-900' },
  { label: 'Xanh dương', value: 'from-dark-900 via-blue-950 to-dark-900' },
  { label: 'Xanh tím', value: 'from-dark-900 via-indigo-950 to-dark-900' },
  { label: 'Xanh lá', value: 'from-dark-900 via-emerald-950 to-dark-900' },
  { label: 'Tím', value: 'from-dark-900 via-purple-950 to-dark-900' },
]

const EMPTY_FORM = {
  tag: '', title: '', subtitle: '', price: '', originalPrice: '',
  ctaText: 'Khám phá', href: '/', image: '',
  gradient: 'from-dark-900 via-dark-800 to-dark-900',
  accent: '#e51c1c', isActive: true, sortOrder: 0,
}

export default function AdminBanners() {
  const { admin } = useAdminStore()
  const [banners, setBanners]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)

  // Product search
  const [search, setSearch]         = useState('')
  const [searchResults, setResults] = useState([])
  const [searching, setSearching]   = useState(false)
  const [showDrop, setShowDrop]     = useState(false)
  const searchRef                   = useRef(null)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getAdminBanners()
      setBanners(Array.isArray(data) ? data : data?.data ?? [])
    } catch { toast.error('Không thể tải danh sách banner') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setSearch(''); setResults([]); setShowForm(true) }
  const openEdit   = (b) => {
    setEditing(b)
    setForm({ tag: b.tag, title: b.title, subtitle: b.subtitle, price: b.price, originalPrice: b.originalPrice, ctaText: b.ctaText, href: b.href, image: b.image, gradient: b.gradient, accent: b.accent, isActive: b.isActive, sortOrder: b.sortOrder })
    setSearch('')
    setResults([])
    setShowForm(true)
  }

  // Tìm sản phẩm theo keyword
  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        setSearching(true)
        const data = await api.get('/products', { params: { search: search.trim(), limit: 6 } })
        const list = Array.isArray(data) ? data : (data?.data?.products ?? data?.products ?? [])
        setResults(list)
        setShowDrop(true)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const pickProduct = (p) => {
    setForm(prev => ({
      ...prev,
      href:          `/san-pham/${p.slug}`,
      image:         p.thumbnail || p.image || prev.image,
      price:         p.price         ?? prev.price,
      originalPrice: p.originalPrice ?? prev.originalPrice,
      title:         prev.title || p.name,
    }))
    setSearch(p.name)
    setShowDrop(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.tag || !form.title) { toast.error('Vui lòng nhập Tag và Tiêu đề'); return }
    setSaving(true)
    try {
      if (editing) {
        await updateBanner(editing.id, form)
        toast.success('Cập nhật banner thành công!')
      } else {
        await createBanner(form)
        toast.success('Tạo banner mới thành công!')
      }
      setShowForm(false)
      load()
    } catch (err) { toast.error(err?.message || 'Lỗi lưu banner') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá banner này?')) return
    try { await deleteBanner(id); toast.success('Đã xoá'); load() }
    catch (err) { toast.error(err?.message || 'Không thể xoá') }
  }

  const handleToggle = async (b) => {
    try {
      await updateBanner(b.id, { isActive: !b.isActive })
      load()
    } catch { toast.error('Lỗi') }
  }

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Banner</h1>
          <p className="text-slate-400 text-sm mt-1">Chỉnh sửa banner hiển thị trên trang chủ</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition">
          <Plus size={16} /> Thêm banner
        </button>
      </div>

      {/* Banner list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id}
              className={`bg-slate-800 border rounded-2xl p-4 flex items-center gap-4 transition ${b.isActive ? 'border-slate-700' : 'border-slate-700/30 opacity-60'}`}>
              {/* Sort handle */}
              <GripVertical size={18} className="text-slate-600 flex-shrink-0 cursor-grab" />

              {/* Preview image */}
              <div className="w-16 h-16 rounded-xl bg-slate-700 flex-shrink-0 overflow-hidden">
                {b.image
                  ? <img src={b.image} alt={b.title} className="w-full h-full object-contain p-1"
                         onError={e => { e.target.style.display='none' }} />
                  : <Image size={24} className="text-slate-500 m-auto mt-4" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: b.accent + '30', color: b.accent }}>
                    {b.tag}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/40 text-slate-400'}`}>
                    {b.isActive ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </div>
                <p className="text-white font-semibold text-sm truncate">{b.title}</p>
                <p className="text-slate-400 text-xs truncate">{b.subtitle}</p>
                <p className="text-red-400 text-xs font-bold mt-0.5">{formatPrice(b.price)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleToggle(b)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white transition"
                  title={b.isActive ? 'Ẩn banner' : 'Hiện banner'}>
                  {b.isActive ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
                <button onClick={() => openEdit(b)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-blue-400 transition"
                  title="Sửa">
                  <Pencil size={16}/>
                </button>
                <button onClick={() => handleDelete(b.id)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
                  title="Xoá">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          ))}

          {banners.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <Image size={40} className="mx-auto mb-3 opacity-40" />
              <p>Chưa có banner nào. Nhấn "Thêm banner" để bắt đầu.</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-white font-bold text-lg">{editing ? 'Sửa Banner' : 'Thêm Banner mới'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tag *</label>
                  <input value={form.tag} onChange={f('tag')} placeholder="VD: Galaxy AI"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Nút CTA</label>
                  <input value={form.ctaText} onChange={f('ctaText')} placeholder="Khám phá"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Tiêu đề *</label>
                <input value={form.title} onChange={f('title')} placeholder="Samsung S24 Ultra"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500" />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Mô tả phụ</label>
                <input value={form.subtitle} onChange={f('subtitle')} placeholder="S Pen · 200MP · Snapdragon 8 Gen 3"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Giá bán (VNĐ)</label>
                  <input type="number" value={form.price} onChange={f('price')} placeholder="31990000"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Giá gốc (VNĐ)</label>
                  <input type="number" value={form.originalPrice} onChange={f('originalPrice')} placeholder="34990000"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">URL hình ảnh</label>
                <input value={form.image} onChange={f('image')} placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500" />
                {form.image && (
                  <img src={form.image} alt="preview" onError={e=>e.target.style.display='none'}
                    className="mt-2 h-24 object-contain mx-auto rounded-xl bg-slate-800 p-2" />
                )}
              </div>

              {/* Product picker */}
              <div className="relative" ref={searchRef}>
                <label className="text-xs text-slate-400 mb-1 block">
                  Chọn sản phẩm
                  <span className="ml-1 text-slate-500">(tự điền link, ảnh, giá)</span>
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setShowDrop(true) }}
                    onFocus={() => search && setShowDrop(true)}
                    placeholder="Gõ tên sản phẩm để tìm..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
                  />
                  {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">...</span>}
                </div>

                {showDrop && searchResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
                    {searchResults.map(p => (
                      <button key={p.id} type="button"
                        onClick={() => pickProduct(p)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 transition text-left">
                        <img src={p.thumbnail || p.image} alt={p.name}
                          onError={e => e.target.style.display='none'}
                          className="w-10 h-10 object-contain rounded-lg bg-slate-900 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{p.name}</p>
                          <p className="text-red-400 text-xs font-bold">{formatPrice(p.price)}</p>
                        </div>
                        <Check size={14} className="text-slate-500 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Href hiển thị (readonly sau khi chọn, có thể sửa tay) */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Link sản phẩm (href)</label>
                <input value={form.href} onChange={f('href')} placeholder="/san-pham/..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Màu nền</label>
                  <select value={form.gradient} onChange={f('gradient')}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500">
                    {GRADIENTS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Màu accent</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.accent} onChange={f('accent')}
                      className="w-10 h-9 rounded-lg cursor-pointer bg-slate-800 border border-slate-600" />
                    <input value={form.accent} onChange={f('accent')} maxLength={7}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Thứ tự (nhỏ = trước)</label>
                  <input type="number" value={form.sortOrder} onChange={f('sortOrder')}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={f('isActive')}
                      className="w-4 h-4 accent-red-600" />
                    <span className="text-slate-300 text-sm">Hiển thị trên trang chủ</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm disabled:opacity-60 transition">
                  <Check size={16}/> {saving ? 'Đang lưu...' : (editing ? 'Lưu thay đổi' : 'Tạo banner')}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-slate-600 text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-800 transition">
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
