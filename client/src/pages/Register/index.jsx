/**
 * pages/Register/index.jsx
 * Trang đăng ký tài khoản ITechZone
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, UserPlus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import InputField from '@/components/forms/InputField'
import useAuthStore from '@/store/useAuthStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  // Kiểm tra hợp lệ tất cả các trường
  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Vui lòng nhập họ tên'
    if (!form.email) e.email = 'Vui lòng nhập email'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email không hợp lệ'
    if (form.phone && !/^0\d{9}$/.test(form.phone))
      e.phone = 'Số điện thoại phải là 10 chữ số, bắt đầu bằng 0'
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu'
    else if (form.password.length < 6) e.password = 'Mật khẩu ít nhất 6 ký tự'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Mật khẩu xác nhận không khớp'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Cập nhật giá trị form theo tên trường
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Xử lý submit form đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
    })
    if (result.success) {
      toast.success('Đăng ký thành công!')
      navigate('/')
    } else {
      toast.error(result.error || 'Đăng ký thất bại')
    }
  }

  return (
    <div className="w-full">
      {/* Tiêu đề trang */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black text-gray-900 dark:text-white">Tạo tài khoản</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Tham gia ITechZone để nhận ưu đãi độc quyền!
        </p>
      </div>

      {/* Form đăng ký */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Họ và tên */}
        <InputField
          label="Họ và tên"
          name="name"
          placeholder="Nguyễn Văn A"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          leftIcon={<User size={16} />}
          required
        />

        {/* Email */}
        <InputField
          label="Email"
          name="email"
          type="email"
          placeholder="email@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          leftIcon={<Mail size={16} />}
          required
        />

        {/* Số điện thoại */}
        <InputField
          label="Số điện thoại"
          name="phone"
          type="tel"
          inputMode="numeric"
          placeholder="0901 234 567"
          value={form.phone}
          onChange={(e) => {
            // Chỉ cho nhập số, tối đa 10 ký tự
            const val = e.target.value.replace(/\D/g, '').slice(0, 10)
            setForm({ ...form, phone: val })
          }}
          onKeyDown={(e) => {
            // Chặn cứng khi đã đủ 10 số — tránh buffer tràn sang field kế
            const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
            if (form.phone.length >= 10 && !allowed.includes(e.key) && !e.ctrlKey && !e.metaKey) {
              e.preventDefault()
            }
          }}
          error={errors.phone}
          leftIcon={<Phone size={16} />}
          maxLength={10}
        />

        {/* Mật khẩu với nút hiện/ẩn */}
        <InputField
          label="Mật khẩu"
          name="password"
          type={showPw ? 'text' : 'password'}
          placeholder="Tối thiểu 6 ký tự"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          leftIcon={<Lock size={16} />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          required
        />

        {/* Xác nhận mật khẩu */}
        <InputField
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          type={showPw ? 'text' : 'password'}
          placeholder="Nhập lại mật khẩu"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          leftIcon={<Lock size={16} />}
          required
        />

        {/* Đồng ý điều khoản */}
        <div className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            required
            id="terms"
            className="mt-0.5 rounded border-gray-300 text-primary"
          />
          <label htmlFor="terms" className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
            Tôi đồng ý với{' '}
            <a href="#" className="text-primary hover:underline">Điều khoản sử dụng</a>
            {' '}và{' '}
            <a href="#" className="text-primary hover:underline">Chính sách bảo mật</a>
          </label>
        </div>

        {/* Nút tạo tài khoản */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-700 disabled:opacity-60 shadow-primary transition-all"
        >
          {isLoading ? 'Đang xử lý...' : <><UserPlus size={18} />Tạo tài khoản</>}
        </button>
      </form>

      {/* Link đến trang đăng nhập */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Đã có tài khoản?{' '}
        <Link to="/dang-nhap" className="text-primary hover:text-primary-700 font-bold">
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
