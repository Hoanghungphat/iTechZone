/**
 * pages/ForgotPassword/index.jsx — Quên mật khẩu (gửi yêu cầu lên admin)
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Mail, Send, Clock, CheckCircle, ArrowLeft } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const COOLDOWN_MS = 15 * 60 * 1000

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError]     = useState('')

  // Khi load trang, kiểm tra cooldown trong localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`forgot_pwd_${email}`)
    if (stored) {
      const remaining = COOLDOWN_MS - (Date.now() - parseInt(stored))
      if (remaining > 0) setCountdown(Math.ceil(remaining / 1000))
    }
  }, [email])

  // Đếm ngược
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); return 0 }
      return c - 1
    }), 1000)
    return () => clearInterval(t)
  }, [countdown])

  const formatCountdown = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Kiểm tra cooldown frontend
    const stored = localStorage.getItem(`forgot_pwd_${email}`)
    if (stored) {
      const remaining = COOLDOWN_MS - (Date.now() - parseInt(stored))
      if (remaining > 0) {
        setCountdown(Math.ceil(remaining / 1000))
        toast.error('Bạn đã gửi yêu cầu rồi, hãy chờ đếm ngược!')
        return
      }
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Vui lòng nhập email hợp lệ')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.status === 429) {
        // Backend trả về thời gian còn lại
        const remainMs = data.remainMs || COOLDOWN_MS
        localStorage.setItem(`forgot_pwd_${email}`, Date.now() - (COOLDOWN_MS - remainMs))
        setCountdown(Math.ceil(remainMs / 1000))
        toast.error(data.message)
      } else if (res.ok) {
        localStorage.setItem(`forgot_pwd_${email}`, Date.now())
        setCountdown(Math.ceil(COOLDOWN_MS / 1000))
        setDone(true)
        toast.success('Yêu cầu đã được ghi nhận!')
      } else {
        setError(data.message || 'Đã xảy ra lỗi')
      }
    } catch {
      setError('Không thể kết nối đến máy chủ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <Link to="/dang-nhap" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
          <ArrowLeft size={15} /> Quay lại đăng nhập
        </Link>
        <h1 className="text-3xl font-display font-black text-gray-900 dark:text-white">Quên mật khẩu</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
          Nhập email đã đăng ký — nhân viên sẽ liên hệ qua <strong>số điện thoại</strong> để hỗ trợ.
        </p>
      </div>

      {done ? (
        <div className="space-y-5">
          {/* Success state */}
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">Yêu cầu đã được ghi nhận!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Nhân viên ITechZone sẽ liên hệ qua số điện thoại đã đăng ký<br />
                trong vòng <strong>15–30 phút</strong> để hỗ trợ đặt lại mật khẩu.
              </p>
            </div>
            {countdown > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                <Clock size={15} />
                Có thể gửi lại sau: <strong>{formatCountdown(countdown)}</strong>
              </div>
            )}
          </div>
          <Link to="/dang-nhap"
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-700 transition-all shadow-primary">
            Về trang đăng nhập
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Email đã đăng ký <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={countdown > 0}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
          </div>

          {/* Cooldown warning */}
          {countdown > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
              <Clock size={15} className="flex-shrink-0" />
              <span>Có thể gửi lại sau: <strong>{formatCountdown(countdown)}</strong></span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || countdown > 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-primary transition-all duration-200"
          >
            {loading ? 'Đang gửi...' : <><Send size={16} /> Gửi yêu cầu hỗ trợ</>}
          </button>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              💡 <strong>Lưu ý:</strong> Mỗi tài khoản chỉ được gửi 1 yêu cầu mỗi 15 phút.
              Đảm bảo số điện thoại đăng ký còn hoạt động để nhận hỗ trợ.
            </p>
          </div>
        </form>
      )}
    </div>
  )
}
