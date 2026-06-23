/**
 * pages/Login/index.jsx
 * Trang đăng nhập ITechZone
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react'
import { toast } from 'react-hot-toast'
import InputField from '@/components/forms/InputField'
import useAuthStore from '@/store/useAuthStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  // Kiểm tra hợp lệ form
  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Vui lòng nhập email'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email không hợp lệ'
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu'
    else if (form.password.length < 6) e.password = 'Mật khẩu ít nhất 6 ký tự'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Xử lý submit form đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = await login(form.email, form.password)
    if (result.success) {
      toast.success('Đăng nhập thành công!')
      // Admin và Staff → vào trang quản lý
      if (['admin', 'staff'].includes(result.role)) {
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    } else {
      toast.error(result.error || 'Đăng nhập thất bại')
    }
  }

  return (
    <div className="w-full">
      {/* Tiêu đề trang */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black text-gray-900 dark:text-white">Đăng nhập</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Chào mừng trở lại với ITechZone!</p>
      </div>

      {/* Form đăng nhập */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Trường email */}
        <InputField
          label="Email"
          name="email"
          type="email"
          placeholder="email@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          leftIcon={<Mail size={16} />}
          required
        />

        {/* Trường mật khẩu với nút hiện/ẩn */}
        <InputField
          label="Mật khẩu"
          name="password"
          type={showPw ? 'text' : 'password'}
          placeholder="Nhập mật khẩu"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          leftIcon={<Lock size={16} />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          required
        />

        {/* Ghi nhớ đăng nhập và quên mật khẩu */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input type="checkbox" className="rounded border-gray-300 text-primary" />
            Ghi nhớ đăng nhập
          </label>
          <a href="#" className="text-sm text-primary hover:text-primary-700 font-medium">
            Quên mật khẩu?
          </a>
        </div>

        {/* Nút đăng nhập */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-primary transition-all duration-200"
        >
          {isLoading ? 'Đang đăng nhập...' : <><LogIn size={18} />Đăng nhập</>}
        </button>
      </form>




      {/* Link đến trang đăng ký */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Chưa có tài khoản?{' '}
        <Link to="/dang-ky" className="text-primary hover:text-primary-700 font-bold">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  )
}
