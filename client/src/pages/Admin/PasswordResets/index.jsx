/**
 * pages/Admin/PasswordResets/index.jsx
 * Admin: xem & xử lý yêu cầu đổi mật khẩu | Staff: xem kết quả đã xử lý
 */
import { useEffect, useState, useCallback } from 'react'
import { KeyRound, CheckCircle, XCircle, Clock, Eye, EyeOff, Phone } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  getPasswordResets,
  completePasswordReset,
  cancelPasswordReset,
  getStaffPasswordResets,
} from '@/services/adminService'
import { formatDate } from '@/utils/format'
import useAdminStore from '@/store/useAdminStore'

const STATUS_CONFIG = {
  pending:   { label: 'Chờ xử lý',  cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  completed: { label: 'Đã xử lý',   cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled: { label: 'Đã huỷ',     cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
}

// ──────────────────────────────────────
// Modal đặt mật khẩu tạm (admin)
// ──────────────────────────────────────
function CompleteModal({ request, onClose, onDone }) {
  const [pwd, setPwd]       = useState('')
  const [show, setShow]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (pwd.length < 6) { setErr('Mật khẩu tạm phải có ít nhất 6 ký tự'); return }
    setLoading(true)
    try {
      await completePasswordReset(request.id, pwd)
      toast.success('Đã đặt lại mật khẩu thành công!')
      onDone()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-1">Đặt mật khẩu tạm</h3>
        <p className="text-sm text-slate-400 mb-5">
          Người dùng: <strong className="text-white">{request.user?.name}</strong><br />
          Email: <span className="text-slate-300">{request.user?.email}</span><br />
          SĐT: <span className="text-slate-300">{request.user?.phone || 'Chưa có'}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mật khẩu tạm *</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={pwd}
                onChange={e => { setPwd(e.target.value); setErr('') }}
                placeholder="Nhập mật khẩu đơn giản để bàn giao"
                className="w-full pr-10 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                           text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2
                           focus:ring-primary/40 focus:border-primary transition"
              />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {err && <p className="text-red-400 text-xs mt-1">{err}</p>}
            <p className="text-xs text-slate-500 mt-1">Ví dụ: Itechzone2024, 123456, ...</p>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition">
              Huỷ
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-700 disabled:opacity-60 transition">
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ──────────────────────────────────────
// Main Page
// ──────────────────────────────────────
export default function PasswordResetsPage() {
  const { admin } = useAdminStore()
  const isAdmin = admin?.role === 'admin'

  const [data, setData]         = useState({ requests: [], total: 0 })
  const [loading, setLoading]   = useState(true)
  const [filterStatus, setFilter] = useState('')
  const [modal, setModal]       = useState(null)   // request object
  const [showPwd, setShowPwd]   = useState({})     // { [id]: bool }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (isAdmin) {
        const res = await getPasswordResets({ status: filterStatus || undefined })
        setData(res.data)
      } else {
        const res = await getStaffPasswordResets()
        setData(res.data)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [isAdmin, filterStatus])

  useEffect(() => { load() }, [load])

  const handleCancel = async (id) => {
    if (!window.confirm('Huỷ yêu cầu này?')) return
    try {
      await cancelPasswordReset(id)
      toast.success('Đã huỷ yêu cầu')
      load()
    } catch (e) { toast.error(e.message) }
  }

  const toggleShowPwd = (id) => setShowPwd(p => ({ ...p, [id]: !p[id] }))

  // ── STAFF VIEW ──────────────────────────────────────────────────
  if (!isAdmin) return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Phone size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Hỗ trợ khách quên mật khẩu</h1>
          <p className="text-sm text-slate-400">Thông tin để liên hệ hỗ trợ khách hàng</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Đang tải...</div>
      ) : data.requests?.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Chưa có yêu cầu nào được xử lý</div>
      ) : (
        <div className="bg-[#1e293b] rounded-2xl border border-white/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/8">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Số điện thoại</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Mật khẩu tạm</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Thời gian xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.requests.map(r => (
                <tr key={r.id} className="hover:bg-white/3 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span className="font-mono text-white font-medium">{r.phone}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <code className={`font-mono text-sm px-2.5 py-1 rounded-lg bg-black/30 border border-white/10 transition ${showPwd[r.id] ? 'text-green-400' : 'text-transparent select-none blur-[3px]'}`}>
                        {r.tempPassword}
                      </code>
                      <button onClick={() => toggleShowPwd(r.id)}
                        className="text-slate-400 hover:text-white transition" title="Hiện/ẩn mật khẩu">
                        {showPwd[r.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{formatDate(r.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  // ── ADMIN VIEW ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header + filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <KeyRound size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Yêu cầu đổi mật khẩu</h1>
            <p className="text-sm text-slate-400">{data.total} yêu cầu</p>
          </div>
        </div>
        <select value={filterStatus} onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer">
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="completed">Đã xử lý</option>
          <option value="cancelled">Đã huỷ</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Đang tải...</div>
      ) : data.requests?.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Không có yêu cầu nào</div>
      ) : (
        <div className="bg-[#1e293b] rounded-2xl border border-white/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/8">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Người dùng</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">SĐT</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Thời gian</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.requests.map(r => {
                const s = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
                return (
                  <tr key={r.id} className="hover:bg-white/3 transition">
                    <td className="px-5 py-4 font-medium text-white">{r.user?.name}</td>
                    <td className="px-5 py-4 text-slate-300">{r.user?.email}</td>
                    <td className="px-5 py-4 text-slate-300">{r.user?.phone || '—'}</td>
                    <td className="px-5 py-4 text-slate-400 text-xs">{formatDate(r.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>
                        {r.status === 'pending'   && <Clock size={11} />}
                        {r.status === 'completed' && <CheckCircle size={11} />}
                        {r.status === 'cancelled' && <XCircle size={11} />}
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {r.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => setModal(r)}
                            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-700 transition">
                            Xử lý
                          </button>
                          <button onClick={() => handleCancel(r.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 border border-red-500/30 transition">
                            Huỷ
                          </button>
                        </div>
                      )}
                      {r.status === 'completed' && (
                        <span className="text-xs text-green-400">MK tạm: <code className="font-mono bg-black/20 px-1 rounded">{r.tempPassword}</code></span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <CompleteModal
          request={modal}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
