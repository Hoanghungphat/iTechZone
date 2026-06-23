/**
 * pages/VerifyEmail/index.jsx — Xác minh email sau đăng ký
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Zap, CheckCircle, Mail } from 'lucide-react'
import { verifyEmail, resendVerifyOtp } from '@/services/authService'
import useAuthStore from '@/store/useAuthStore'

const RESEND_COUNTDOWN = 60
const OTP_EXPIRE = 5 * 60

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const setAuth = useAuthStore(s => s.setAuth)

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(RESEND_COUNTDOWN)
  const [otpExpire, setOtpExpire] = useState(OTP_EXPIRE)
  const [done, setDone] = useState(false)
  const otpRefs = useRef([])

  useEffect(() => {
    if (!email) navigate('/dang-ky')
    else setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }, [])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  useEffect(() => {
    if (otpExpire <= 0) return
    const t = setTimeout(() => setOtpExpire(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [otpExpire])

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }
  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }
  const handleOtpPaste = e => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) { setOtp(text.split('')); otpRefs.current[5]?.focus() }
  }

  const handleVerify = async e => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) return toast.error('Nhập đủ 6 chữ số')
    setLoading(true)
    try {
      const { user, token } = await verifyEmail(email, code)
      // setAuth nếu store có hàm đó, hoặc set trực tiếp
      if (typeof setAuth === 'function') setAuth(user, token)
      setDone(true)
      toast.success('Xác minh thành công! Chào mừng bạn đến ITechZone 🎉')
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await resendVerifyOtp(email)
      toast.success('Đã gửi lại mã OTP')
      setResendCountdown(RESEND_COUNTDOWN)
      setOtpExpire(OTP_EXPIRE)
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const card = { width: '100%', maxWidth: '420px', background: 'var(--bg-card,#1e293b)', borderRadius: '20px', padding: '40px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary,#0f172a)' }}>
      <div style={{ ...card, textAlign: 'center' }}>
        <CheckCircle size={64} color="#22c55e" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: '#f1f5f9', fontSize: '22px', fontWeight: '800', margin: '0 0 8px' }}>Xác minh thành công!</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Đang chuyển về trang chủ...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-primary,#0f172a)' }}>
      <div style={card}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Zap size={28} color="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#f1f5f9' }}>Xác minh email</h1>
          <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
            Mã OTP đã được gửi đến<br />
            <strong style={{ color: '#f1f5f9' }}>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* OTP inputs */}
          <div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }} onPaste={handleOtpPaste}>
              {otp.map((v, i) => (
                <input key={i} ref={el => otpRefs.current[i] = el}
                  type="text" inputMode="numeric" maxLength={1} value={v}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  style={{
                    width: '52px', height: '58px', textAlign: 'center', fontSize: '24px', fontWeight: '800',
                    background: v ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${v ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px', color: '#f1f5f9', outline: 'none', transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
            {otpExpire > 0 ? (
              <p style={{ textAlign: 'center', fontSize: '13px', color: otpExpire < 60 ? '#ef4444' : '#94a3b8', margin: '12px 0 0' }}>
                ⏱ Mã hết hạn sau: <strong>{formatTime(otpExpire)}</strong>
              </p>
            ) : (
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#ef4444', margin: '12px 0 0' }}>⚠️ Mã OTP đã hết hạn</p>
            )}
          </div>

          <button type="submit" disabled={loading || otp.join('').length < 6}
            style={{ padding: '13px', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: (loading || otp.join('').length < 6) ? 'not-allowed' : 'pointer', opacity: (loading || otp.join('').length < 6) ? 0.6 : 1 }}>
            {loading ? 'Đang xác minh...' : '✅ Xác minh tài khoản'}
          </button>

          <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
            Chưa nhận được mã?{' '}
            {resendCountdown > 0
              ? <span style={{ color: '#94a3b8' }}>Gửi lại sau {resendCountdown}s</span>
              : <button type="button" onClick={handleResend} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Gửi lại mã</button>
            }
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: 'rgba(59,130,246,0.1)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Mail size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '12px', color: '#93c5fd', lineHeight: 1.5 }}>
              Kiểm tra cả thư mục <strong>Spam/Junk</strong> nếu không thấy email
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
