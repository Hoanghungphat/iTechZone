/**
 * pages/Admin/Requests/index.jsx — Log duyệt yêu cầu từ nhân viên
 */
import { useEffect, useState } from 'react'
import { ClipboardList, Check, X, Clock, ShieldOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getRequests, approveRequest, rejectRequest } from '@/services/adminService'
import { formatDate } from '@/utils/format'
import useAdminStore from '@/store/useAdminStore'

const TYPE_MAP = {
  DELETE_PRODUCT: { label: 'Xoá sản phẩm',    cls: 'bg-red-500/20 text-red-400' },
  EDIT_USER:      { label: 'Sửa người dùng',   cls: 'bg-blue-500/20 text-blue-400' },
  RESET_PASSWORD: { label: 'Reset mật khẩu',   cls: 'bg-purple-500/20 text-purple-400' },
}
const STATUS_ICONS = {
  pending:  <Clock size={14} className="text-yellow-400" />,
  approved: <Check size={14} className="text-green-400" />,
  rejected: <X size={14} className="text-red-400" />,
}

export default function AdminRequests() {
  const { admin } = useAdminStore()
  const isAdmin = admin?.role === 'admin'
  const [data, setData] = useState({ requests: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // { id, action: 'approve'|'reject' }
  const [reviewNote, setReviewNote] = useState('')

  const load = () => {
    setLoading(true)
    getRequests({ page, limit: 20, status: filterStatus || undefined })
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, filterStatus])

  const handleConfirm = async () => {
    try {
      if (modal.action === 'approve') {
        await approveRequest(modal.id, reviewNote)
        toast.success('Đã duyệt và thực hiện yêu cầu!')
      } else {
        await rejectRequest(modal.id, reviewNote)
        toast.success('Đã từ chối yêu cầu')
      }
      setModal(null)
      setReviewNote('')
      load()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Duyệt yêu cầu</h1>
        <p className="text-slate-400 text-sm mt-1">
          {isAdmin
            ? 'Log yêu cầu từ nhân viên cần Admin phê duyệt'
            : 'Danh sách yêu cầu đã gửi — chỉ Admin mới có quyền duyệt'}
        </p>
        {!isAdmin && (
          <div className="mt-2 inline-flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5">
            <ShieldOff size={13} /> Bạn chỉ có quyền xem, không thể duyệt hoặc từ chối
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[['', 'Tất cả'], ['pending', 'Chờ duyệt'], ['approved', 'Đã duyệt'], ['rejected', 'Từ chối']].map(([v, l]) => (
          <button key={v} onClick={() => { setFilterStatus(v); setPage(1) }}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterStatus === v ? 'bg-red-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && <div className="text-center text-slate-400 py-12">Đang tải...</div>}
        {!loading && !data.requests.length && (
          <div className="text-center py-16">
            <ClipboardList size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">Không có yêu cầu nào</p>
          </div>
        )}
        {data.requests.map(req => {
          const typeInfo = TYPE_MAP[req.type] || { label: req.type, cls: 'bg-slate-600 text-slate-300' }
          return (
            <div key={req.id} className="bg-slate-800 rounded-2xl border border-slate-700/50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${typeInfo.cls}`}>{typeInfo.label}</span>
                    <div className="flex items-center gap-1.5 text-xs">
                      {STATUS_ICONS[req.status]}
                      <span className={`font-medium ${req.status === 'pending' ? 'text-yellow-400' : req.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                        {req.status === 'pending' ? 'Chờ duyệt' : req.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                      </span>
                    </div>
                  </div>
                  <p className="text-white font-semibold">{req.targetName}</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Bởi <span className="text-slate-300">{req.requestedBy?.name}</span> · {formatDate(req.createdAt)}
                  </p>
                  {req.note && <p className="text-slate-500 text-xs mt-1.5 bg-slate-700/40 rounded-lg px-3 py-1.5">📝 {req.note}</p>}
                  {req.reviewedBy && (
                    <p className="text-slate-500 text-xs mt-1.5">
                      Duyệt bởi: <span className="text-slate-400">{req.reviewedBy.name}</span>
                      {req.reviewNote && ` — "${req.reviewNote}"`}
                    </p>
                  )}
                  {req.payload && (
                    <details className="mt-2">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">Xem chi tiết thay đổi</summary>
                      <pre className="text-xs text-slate-400 bg-slate-700/40 rounded-lg p-3 mt-1.5 overflow-x-auto">
                        {JSON.stringify(req.payload, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                {req.status === 'pending' && isAdmin && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setModal({ id: req.id, action: 'approve' })}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs font-semibold rounded-xl transition-colors">
                      <Check size={14} /> Duyệt
                    </button>
                    <button onClick={() => setModal({ id: req.id, action: 'reject' })}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold rounded-xl transition-colors">
                      <X size={14} /> Từ chối
                    </button>
                  </div>
                )}
                {req.status === 'pending' && !isAdmin && (
                  <span className="text-xs text-slate-500 flex-shrink-0 italic">Chờ Admin duyệt</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40">← Trước</button>
          <span className="text-slate-400 text-sm">{page} / {data.totalPages}</span>
          <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40">Tiếp →</button>
        </div>
      )}

      {/* Confirm Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-white font-bold mb-4">
              {modal.action === 'approve' ? '✅ Xác nhận duyệt yêu cầu' : '❌ Từ chối yêu cầu'}
            </h3>
            <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)}
              placeholder="Ghi chú (tùy chọn)..."
              className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none mb-4"
              rows={3} />
            <div className="flex gap-3">
              <button onClick={() => { setModal(null); setReviewNote('') }}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm font-medium">
                Huỷ
              </button>
              <button onClick={handleConfirm}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors ${modal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {modal.action === 'approve' ? 'Duyệt' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
