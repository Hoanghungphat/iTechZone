/**
 * pages/Admin/Users/index.jsx — Quản lý người dùng (Admin only)
 */
import { useEffect, useState } from 'react'
import { Search, ToggleLeft, ToggleRight, Trash2, Edit2, X, Save, KeyRound, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getUsers, toggleUserActive, deleteUserAdmin, updateUserAdmin, resetUserPassword } from '@/services/adminService'
import { formatDate } from '@/utils/format'
import useAdminStore from '@/store/useAdminStore'

export default function AdminUsers() {
  const { admin } = useAdminStore()
  const isAdmin = admin?.role === 'admin'

  const [data, setData] = useState({ users: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [resetModal, setResetModal] = useState(null)
  const [resetForm, setResetForm] = useState({ newPassword: '', note: '' })
  const [showPw, setShowPw] = useState(false)

  const load = () => {
    setLoading(true)
    getUsers({ page, limit: 15, search: search || undefined, role: 'user' })
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [page, search])

  const handleToggle = async (id) => {
    try { await toggleUserActive(id); toast.success('Đã cập nhật trạng thái'); load() }
    catch (err) { toast.error(err.message) }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xoá người dùng "${name}"?`)) return
    try { await deleteUserAdmin(id); toast.success('Đã xoá người dùng'); load() }
    catch (err) { toast.error(err.message) }
  }

  const openEdit = (user) => {
    setEditModal(user)
    setEditForm({ name: user.name, phone: user.phone || '' })
  }

  const openReset = (user) => {
    setResetModal(user)
    setResetForm({ newPassword: '', note: '' })
    setShowPw(false)
  }

  const handleSaveEdit = async () => {
    try {
      if (isAdmin) {
        await updateUserAdmin(editModal.id, editForm)
        toast.success('Đã cập nhật thông tin')
      } else {
        await updateUserAdmin(editModal.id, { payload: editForm, note: 'Chỉnh sửa thông tin khách hàng' })
        toast.success('Đã gửi yêu cầu chỉnh sửa cho Admin duyệt')
      }
      setEditModal(null)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const handleResetPassword = async () => {
    if (!resetForm.newPassword || resetForm.newPassword.length < 6) {
      return toast.error('Mật khẩu mới phải ít nhất 6 ký tự')
    }
    try {
      await resetUserPassword(resetModal.id, resetForm.newPassword, resetForm.note)
      if (isAdmin) {
        toast.success('Đã đổi mật khẩu thành công!')
      } else {
        toast.success('Đã gửi yêu cầu reset mật khẩu, chờ Admin duyệt')
      }
      setResetModal(null)
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Người dùng</h1>
        <p className="text-slate-400 text-sm mt-1">Quản lý tài khoản khách hàng</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Tìm theo tên, email..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500" />
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Người dùng', 'Email', 'Điện thoại', 'Ngày tạo', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Đang tải...</td></tr>
              ) : data.users.map(u => (
                <tr key={u.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center text-red-400 font-bold text-xs">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u.email}</td>
                  <td className="px-4 py-3 text-slate-400">{u.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {u.isActive ? 'Hoạt động' : 'Khoá'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Chỉnh sửa">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => openReset(u)}
                        className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors" title="Reset mật khẩu">
                        <KeyRound size={15} />
                      </button>
                      {isAdmin && <>
                        <button onClick={() => handleToggle(u.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                          {u.isActive ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} />}
                        </button>
                        <button onClick={() => handleDelete(u.id, u.name)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !data.users.length && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">Không có người dùng</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
            <p className="text-slate-400 text-sm">Tổng: {data.total} người dùng</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40">← Trước</button>
              <span className="px-3 py-1.5 text-slate-400 text-sm">{page} / {data.totalPages}</span>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40">Tiếp →</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold">Chỉnh sửa thông tin</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            {!isAdmin && (
              <p className="text-amber-400 text-xs mb-4 bg-amber-500/10 rounded-xl px-3 py-2">
                ⚠️ Yêu cầu chỉnh sửa sẽ gửi Admin duyệt trước khi áp dụng
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Họ tên</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Điện thoại</label>
                <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-red-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm font-medium">
                Huỷ
              </button>
              <button onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center justify-center gap-2">
                <Save size={15} /> {isAdmin ? 'Lưu' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-bold">Reset mật khẩu</h3>
                <p className="text-slate-400 text-xs mt-0.5">{resetModal.name} · {resetModal.email}</p>
              </div>
              <button onClick={() => setResetModal(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            {!isAdmin && (
              <p className="text-amber-400 text-xs mb-4 bg-amber-500/10 rounded-xl px-3 py-2">
                ⚠️ Yêu cầu sẽ gửi Admin duyệt trước khi áp dụng
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Mật khẩu mới <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={resetForm.newPassword}
                    onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full px-3 py-2.5 pr-10 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Lý do (tùy chọn)</label>
                <input
                  value={resetForm.note}
                  onChange={e => setResetForm({ ...resetForm, note: e.target.value })}
                  placeholder="VD: Khách hàng quên mật khẩu"
                  className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setResetModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm font-medium">
                Huỷ
              </button>
              <button onClick={handleResetPassword}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold flex items-center justify-center gap-2">
                <KeyRound size={15} /> {isAdmin ? 'Đổi mật khẩu' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
