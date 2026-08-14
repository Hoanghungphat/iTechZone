/**
 * pages/Checkout/index.jsx
 * Trang thanh toán đơn hàng ITechZone
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, CreditCard, CheckCircle, Copy, QrCode } from 'lucide-react'
import { toast } from 'react-hot-toast'
import InputField from '@/components/forms/InputField'
import SelectField from '@/components/forms/SelectField'
import CartSummary from '@/components/cart/CartSummary'
import Breadcrumb from '@/components/common/Breadcrumb'
import useCartStore from '@/store/useCartStore'
import useAuthStore from '@/store/useAuthStore'
import { createOrder, cancelOrder, submitPaymentProof } from '@/services/orderService'
import { PAYMENT_METHODS } from '@/constants'

const CITY_OPTIONS = [
  { value: 'hcm', label: 'TP. Hồ Chí Minh' },
  { value: 'hn',  label: 'Hà Nội' },
  { value: 'dn',  label: 'Đà Nẵng' },
  { value: 'ct',  label: 'Cần Thơ' },
  { value: 'other', label: 'Tỉnh thành khác' },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false) // chống double submit
  const [selectedPayment, setSelectedPayment] = useState('cod')
  const [qrData, setQrData] = useState(null) // { orderId, amount }
  const [countdown, setCountdown] = useState(300)
  const timerRef = useRef(null)
  const [proofImage, setProofImage] = useState(null)   // base64
  const [proofUploading, setProofUploading] = useState(false)

  // Đọc file ảnh → base64
  const handleProofFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh tối đa 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => setProofImage(reader.result)
    reader.readAsDataURL(file)
  }

  // Gửi xác nhận chuyển khoản + ảnh
  const handleConfirmPayment = async () => {
    if (!proofImage) { toast.error('Vui lòng chụp và tải ảnh xác nhận chuyển khoản'); return }
    setProofUploading(true)
    try {
      await submitPaymentProof(qrData.orderId, proofImage)
      clearInterval(timerRef.current)
      toast.success('✅ Xác nhận thành công! Staff sẽ kiểm tra và xử lý đơn hàng của bạn.', { duration: 5000 })
      navigate('/tai-khoan/don-hang')
    } catch {
      toast.error('Có lỗi khi gửi ảnh. Vui lòng thử lại.')
    } finally {
      setProofUploading(false)
    }
  }

  const [form, setForm] = useState({
    name:     user?.name  || '',
    phone:    user?.phone || '',
    email:    user?.email || '',
    city:     '',
    district: '',
    ward:     '',
    address:  '',
    note:     '',
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const totalAmount  = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  // Countdown 5 phút khi hiện QR
  useEffect(() => {
    if (!qrData) return
    setCountdown(300)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          cancelOrder(qrData.orderId).catch(() => {})
          toast.error('⏰ Đơn hàng đã bị hủy do hết thời gian thanh toán', { duration: 5000 })
          setQrData(null)
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [qrData?.orderId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) return
    if (!user) {
      toast.error('Vui lòng đăng nhập để đặt hàng')
      navigate('/dang-nhap')
      return
    }

    // Chống double submit (click nhanh / StrictMode)
    if (submittingRef.current) return
    submittingRef.current = true

    setLoading(true)
    try {
      const orderItems = items.map(item => ({
        productId:    item.id,
        productName:  item.name,
        productImage: item.thumbnail || null,
        quantity:     item.qty,
        price:        item.price,
        variant:      item.variant || null,
      }))

      const shippingAddress = [form.address, form.district, form.city].filter(Boolean).join(', ')

      const res = await createOrder({
        shippingName:    form.name,
        shippingPhone:   form.phone,
        shippingAddress,
        paymentMethod:   selectedPayment,
        note:            form.note || undefined,
        items:           orderItems,
      })

      clearCart()

      if (selectedPayment === 'banking') {
        const orderId = res?.data?.id || res?.id || ('DH' + Date.now())
        setQrData({ orderId, amount: totalAmount })
      } else {
        toast.success('🎉 Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại ITechZone.', { duration: 5000 })
        navigate('/')
      }
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const bankRows = [
    ['Ngân hàng',     'Sacombank'],
    ['Số tài khoản',  '060310334254'],
    ['Chủ tài khoản', 'Lê Thế Nguyên'],
    ['Số tiền',       qrData ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(qrData.amount) : ''],
    ['Nội dung CK',   qrData ? `ITECHZONE ${qrData.orderId}` : ''],
  ]

  return (
    <>
      {/* ===== TRANG THANH TOÁN ===== */}
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-white dark:bg-dark-900 border-b border-gray-100 dark:border-dark-800 py-5">
          <div className="container-custom">
            <Breadcrumb items={[{ label: 'Giỏ hàng', href: '/gio-hang' }, { label: 'Thanh toán', href: '#' }]} />
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mt-3">Thanh toán</h1>
          </div>
        </div>

        <div className="container-custom py-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cột chính */}
              <div className="lg:col-span-2 space-y-6">
                {/* Thông tin giao hàng */}
                <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-dark-700">
                  <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                    <MapPin size={18} className="text-primary" /> Thông tin giao hàng
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Họ và tên"        name="name"     value={form.name}     onChange={handleChange} placeholder="Nguyễn Văn A"        required />
                    <InputField label="Số điện thoại"    name="phone"    value={form.phone}    onChange={handleChange} placeholder="0901 234 567" type="tel" required />
                    <InputField label="Email"             name="email"    value={form.email}    onChange={handleChange} placeholder="email@example.com" type="email" className="sm:col-span-2" />
                    <SelectField label="Tỉnh / Thành phố" name="city"    value={form.city}     onChange={handleChange} options={CITY_OPTIONS} required />
                    <InputField label="Quận / Huyện"     name="district" value={form.district} onChange={handleChange} placeholder="Quận 1" required />
                    <InputField label="Địa chỉ cụ thể"   name="address"  value={form.address}  onChange={handleChange} placeholder="Số nhà, tên đường" className="sm:col-span-2" required />
                    <InputField label="Ghi chú (tùy chọn)" name="note"   value={form.note}     onChange={handleChange} placeholder="Ghi chú cho đơn hàng..." className="sm:col-span-2" />
                  </div>
                </div>

                {/* Phương thức thanh toán */}
                <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-dark-700">
                  <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                    <CreditCard size={18} className="text-primary" /> Phương thức thanh toán
                  </h2>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map((method) => (
                      <label key={method.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedPayment === method.id
                            ? 'border-primary bg-primary-50 dark:bg-primary-950'
                            : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'
                        }`}>
                        <input type="radio" name="payment" value={method.id}
                          checked={selectedPayment === method.id}
                          onChange={() => setSelectedPayment(method.id)}
                          className="text-primary" />
                        <span className="font-semibold text-sm text-gray-900 dark:text-white flex-1">{method.name}</span>
                        {selectedPayment === method.id && <CheckCircle size={18} className="text-primary" />}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Nút đặt hàng */}
                <button type="submit" disabled={loading || items.length === 0}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-base hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-primary transition-all">
                  {loading ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                </button>
              </div>

              {/* Cột phụ */}
              <div>
                <CartSummary items={items} showCheckoutBtn={false} />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ===== VIETQR MODAL ===== */}
      {qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header + Countdown */}
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode size={20} className="text-white" />
                <h3 className="text-white font-bold">Quét mã để thanh toán</h3>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                countdown <= 60 ? 'bg-white/30 animate-pulse' : 'bg-white/20'
              } text-white`}>
                ⏱ {String(Math.floor(countdown / 60)).padStart(2,'0')}:{String(countdown % 60).padStart(2,'0')}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* QR Image */}
              <div className="flex justify-center">
                <img
                  src={`https://img.vietqr.io/image/SACOMBANK-060310334254-compact2.png?amount=${qrData.amount}&addInfo=ITECHZONE ${qrData.orderId}&accountName=LeTheNguyen`}
                  alt="VietQR Sacombank"
                  className="w-56 h-56 rounded-2xl border-4 border-gray-100"
                />
              </div>

              {/* Nút xác nhận ngay dưới QR */}
              <button
                onClick={() => { clearInterval(timerRef.current); navigate('/tai-khoan/don-hang') }}
                className="w-full py-2.5 border border-primary text-primary hover:bg-primary/5 rounded-2xl text-sm font-medium transition-colors">
                Bỏ qua, xem đơn hàng →
              </button>

              {/* Thông tin ngân hàng */}
              <div className="bg-gray-50 dark:bg-dark-700 rounded-2xl p-4 space-y-2 text-sm">
                {bankRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
                    <div className="flex items-center gap-1">
                      <span className={`font-semibold text-gray-900 dark:text-white text-right ${label === 'Nội dung CK' ? 'text-red-500' : ''}`}>
                        {value}
                      </span>
                      <button onClick={() => { navigator.clipboard.writeText(value); toast.success('Đã sao chép!') }}
                        className="text-gray-400 hover:text-primary transition-colors flex-shrink-0">
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2 text-center">
                ⚠️ Vui lòng nhập <strong>đúng nội dung chuyển khoản</strong> để đơn hàng được xác nhận nhanh nhất
              </p>

              {/* Upload ảnh xác nhận */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                  📸 Tải ảnh xác nhận chuyển khoản
                </label>
                <label className="flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-2xl cursor-pointer hover:border-primary transition-colors bg-gray-50 dark:bg-dark-700">
                  {proofImage ? (
                    <img src={proofImage} alt="proof" className="h-full w-full object-cover rounded-2xl" />
                  ) : (
                    <>
                      <span className="text-2xl">📷</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">Chụp màn hình chuyển khoản thành công và tải lên</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleProofFile} />
                </label>
                {proofImage && (
                  <button onClick={() => setProofImage(null)}
                    className="text-xs text-red-400 hover:text-red-500 w-full text-center">✕ Xoá ảnh</button>
                )}
              </div>

              {/* Nút xác nhận thanh toán */}
              <button
                onClick={handleConfirmPayment}
                disabled={proofUploading || !proofImage}
                className="w-full py-3 bg-primary hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-colors">
                {proofUploading ? 'Đang gửi...' : '✅ Xác nhận đã thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
