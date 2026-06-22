/**
 * pages/Admin/Logs/index.jsx — Lịch sử hoạt động (Admin only)
 */
import { useEffect, useState } from 'react'
import { Activity, Search } from 'lucide-react'
import { getLogs, getStaff } from '@/services/adminService'
import { formatDate } from '@/utils/format'

const ACTION_MAP = {
  UPDATE_ORDER_STATUS: { label: 'Cập nhật đơn hàng', cls: 'bg-blue-500/20 text-blue-400' },
  APPROVE_REQUEST:     { label: 'Duyệt yêu cầu',     cls: 'bg-green-500/20 text-green-400' },
  REJECT_REQUEST:      { label: 'Từ chối yêu cầu',   cls: 'bg-red-500/20 text-red-400' },
  DELETE_PRODUCT:      { label: 'Xoá sản phẩm',       cls: 'bg-orange-500/20 text-orange-400' },
}

const ROLE_CLS = {
  admin: 'bg-red-500/20 text-red-400',
  staff: 'bg-blue-500/20 text-blue-400',
}

export default function AdminLogs() {
  const [data, setData]       = useState({ logs: [], total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [staffList, setStaffList] = useState([])
  const [filterUser, setFilterUser]     = useState('')
  const [filterAction, setFilterAction] = useState('')

  useEffect(() => {
    getLogs({}).then(r => {
      // Lấy danh sách user duy nhất từ logs để filter
    }).catch(() => {})
    getStaff().catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    getLogs({
      page,
      limit: 30,
      userId: filterUser || undefined,
      action: filterAction || undefined,
    })
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filterUser, filterAction])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity size={22} className="text-red-400" /> Lịch sử hoạt động
        </h1>
        <p className="text-slate-400 text-sm mt-1">Toàn bộ thao tác của Admin &amp; Nhân viên — chỉ Admin mới xem được</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {[
            ['', 'Tất cả hành động'],
            ['UPDATE_ORDER_STATUS', 'Cập nhật đơn'],
            ['APPROVE_REQUEST', 'Duyệt yêu cầu'],
            ['REJECT_REQUEST', 'Từ chối'],
          ].map(([v, l]) => (
            <button key={v} onClick={() => { setFilterAction(v); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterAction === v ? 'bg-red-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
              {l}
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
                {['Thời gian', 'Người thực hiện', 'Vai trò', 'Hành động', 'Mô tả'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400">Đang tải...</td></tr>
              ) : !data.logs.length ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <Activity size={36} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Chưa có hoạt động nào được ghi lại</p>
                  </td>
                </tr>
              ) : data.logs.map(log => {
                const actionInfo = ACTION_MAP[log.action] || { label: log.action, cls: 'bg-slate-600 text-slate-300' }
                return (
                  <tr key={log.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{log.userName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${ROLE_CLS[log.userRole] || 'bg-slate-600 text-slate-400'}`}>
                        {log.userRole === 'admin' ? '👑 Admin' : '🧑‍💼 Nhân viên'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${actionInfo.cls}`}>
                        {actionInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate" title={log.detail}>
                      {log.detail || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-slate-400 text-sm">Tổng: {data.total} bản ghi</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40">← Trước</button>
              <span className="px-3 py-1.5 text-slate-400 text-sm">{page} / {data.totalPages}</span>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40">Tiếp →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
