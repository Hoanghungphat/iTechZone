/**
 * pages/Admin/Orders/index.jsx — Quản lý đơn hàng
 */
import { useEffect, useState, Fragment } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getOrders, updateOrderStatus } from '@/services/adminService'
import { formatPrice, formatDate } from '@/utils/format'

const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'pending',   label: 'Chờ xác nhận', cls: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'confirmed', label: 'Đã xác nhận',  cls: 'bg-blue-500/20 text-blue-400' },
  { value: 'shipping',  label: 'Đang giao',     cls: 'bg-indigo-500/20 text-indigo-400' },
  { value: 'delivered', label: 'Đã giao',       cls: 'bg-green-500/20 text-green-400' },
  { value: 'cancelled', label: 'Đã hủy',        cls: 'bg-red-500/20 text-red-400' },
]
const STATUS_MAP = Object.fromEntries(STATUSES.filter(s => s.value).map(s => [s.value, s]))

const NEXT_STATUS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['shipping',  'cancelled'],
  shipping:  ['delivered'],
  delivered: [],
  cancelled: [],
}

export default function AdminOrders() {
  const [data, setData]               = useState({ orders: [], total: 0 })
  const [loading, setLoading]         = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(1)
  const [expanded, setExpanded]       = useState(null)
  const [proofModal, setProofModal]   = useState(null) // base64 ảnh đang xem

  const load = () => {
    setLoading(true)
    getOrders({ page, limit: 15, status: filterStatus || undefined, search: search || undefined })
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, filterStatus, search])

  const handleStatus = async (id, status) => {
    try { await updateOrderStatus(id, status); toast.success('Đã cập nhật trạng thái'); load() }
    catch (err) { toast.error(err.message) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Đơn hàng</h1>
        <p className="text-slate-400 text-sm mt-1">Quản lý tất cả đơn hàng hệ thống</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm tên, SĐT..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s.value} onClick={() => { setFilterStatus(s.value); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterStatus === s.value ? 'bg-red-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Mã đơn', 'Khách hàng', 'Địa chỉ', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Hành động'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Đang tải...</td></tr>
              ) : data.orders.map(o => {
                const s     = STATUS_MAP[o.status]
                const nexts = NEXT_STATUS[o.status] || []
                return (
                  <Fragment key={o.id}>
                    <tr className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                            className="text-slate-400 hover:text-white">
                            <ChevronDown size={14} className={`transition-transform ${expanded === o.id ? 'rotate-180' : ''}`} />
                          </button>
                          <span className="text-slate-300 font-mono text-xs">{o.id.slice(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{o.shippingName}</p>
                        <p className="text-slate-400 text-xs">{o.shippingPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[150px] truncate">{o.shippingAddress}</td>
                      <td className="px-4 py-3 text-red-400 font-bold">{formatPrice(o.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${o.paymentMethod === 'cod' ? 'bg-slate-600 text-slate-300' : 'bg-blue-500/20 text-blue-400'}`}>
                          {o.paymentMethod.toUpperCase()}
                        </span>
                        {/* Ảnh chứng minh chuyển khoản */}
                        {o.paymentProof && (
                          <button
                            onClick={() => setProofModal(o.paymentProof)}
                            title="Xem ảnh xác nhận chuyển khoản"
                            className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                            📷 Proof
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${s?.cls || 'bg-slate-600 text-slate-400'}`}>
                          {s?.label || o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {nexts.length > 0 && (
                          <div className="flex gap-1">
                            {nexts.map(ns => (
                              <button key={ns} onClick={() => handleStatus(o.id, ns)}
                                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${STATUS_MAP[ns]?.cls || 'bg-slate-700 text-slate-300'} hover:opacity-80`}>
                                → {STATUS_MAP[ns]?.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                    {expanded === o.id && (
                      <tr key={o.id + '_detail'}>
                        <td colSpan={7} className="px-8 py-4 bg-slate-700/20">
                          <p className="text-slate-400 text-xs font-medium mb-2">Chi tiết đơn hàng:</p>
                          <div className="space-y-2">
                            {o.items?.map(item => (
                              <div key={item.id} className="flex items-center gap-3 text-sm">
                                {item.productImage && <img src={item.productImage} className="w-8 h-8 rounded-lg object-cover" />}
                                <span className="text-slate-300 flex-1">{item.productName}</span>
                                <span className="text-slate-400">x{item.quantity}</span>
                                <span className="text-red-400 font-medium">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          {o.note && <p className="text-slate-400 text-xs mt-2">Ghi chú: {o.note}</p>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {!loading && !data.orders.length && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">Không có đơn hàng</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-slate-400 text-sm">Tổng: {data.total} đơn hàng</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40">← Trước</button>
              <span className="px-3 py-1.5 text-slate-400 text-sm">{page} / {data.totalPages}</span>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40">Tiếp →</button>
            </div>
          </div>
        )}
      </div>

      {/* ===== LIGHTBOX xem ảnh proof ===== */}
      {proofModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setProofModal(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setProofModal(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm">
              ✕ Đóng
            </button>
            <img
              src={proofModal}
              alt="Ảnh xác nhận thanh toán"
              className="w-full rounded-2xl shadow-2xl border-4 border-white/10"
            />
            <p className="text-center text-white/50 text-xs mt-3">Click ra ngoài để đóng</p>
          </div>
        </div>
      )}
    </div>
  )
}
