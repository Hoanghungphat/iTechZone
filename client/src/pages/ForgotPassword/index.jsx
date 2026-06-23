/**
 * pages/ForgotPassword/index.jsx — Quên mật khẩu (3 bước)
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Zap, Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { forgotPassword, verifyForgotOtp, resetPassword } from '@/services/authService'

const RESEND_COUNTDOWN = 60
const OTP_EXPIRE = 5 * 60 // 300s

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)  // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showCfm, setShowCfm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [otpExpire, setOtpExpire] = useState(0)
  const otpRefs = useRef([])

  // Countdown resend
  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  // Countdown OTP expire
  useEffect(() => {
    if (otpExpire <= 0) return
    const t = setTimeout(() => setOtpExpire(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [otpExpire])

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // Step 1 — gửi OTP
  const handleSendOtp = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await forgotPassword(email)
      toast.success('Đã gửi mã OTP về email!')
      setStep(2)
      setResendCountdown(RESEND_COUNTDOWN)
      setOtpExpire(OTP_EXPIRE)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 2 — xử lý OTP input
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
    if (text.length === 6) {
      setOtp(text.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  const handleVerifyOtp = async e => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) return toast.error('Nhập đủ 6 chữ số')
    setLoading(true)
    try {
      await verifyForgotOtp(email, code)
      toast.success('OTP hợp lệ!')
      setStep(3)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await forgotPassword(email)
      toast.success('Đã gửi lại mã OTP')
      setResendCountdown(RESEND_COUNTDOWN)
      setOtpExpire(OTP_EXPIRE)
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Step 3 — đặt mật khẩu mới
  const handleResetPassword = async e => {
    e.preventDefault()
    if (newPwd.length < 6) return toast.error('Mật khẩu phải có ít nhất 6 ký tự')
    if (newPwd !== confirmPwd) return toast.error('Mật khẩu xác nhận không khớp')
    setLoading(true)
    try {
      await resetPassword(email, otp.join(''), newPwd)
      toast.success('Đổi mật khẩu thành công!')
      navigate('/dang-nhap')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-primary, #0f172a)' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-card, #1e293b)', borderRadius: '20px', padding: '40px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Zap size={26} color="#fff" />
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700',
                  background: step > s ? '#22c55e' : step === s ? '#ef4444' : 'rgba(255,255,255,0.1)',
                  color: step >= s ? '#fff' : '#94a3b8',
                  transition: 'all 0.3s'
                }}>
                  {step > s ? <CheckCircle size={16} /> : s}
                </div>
                {s < 3 && <div style={{ width: '32px', height: '2px', background: step > s ? '#22c55e' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'all 0.3s' }} />}
              </div>
            ))}
          </div>

          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#f1f5f9' }}>
            {step === 1 ? 'Quên mật khẩu' : step === 2 ? 'Nhập mã OTP' : 'Mật khẩu mới'}
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8' }}>
            {step === 1 && 'Nhập email để nhận mã xác minh'}
            {step === 2 && <>Mã OTP đã gửi đến <strong style={{ color: '#f1f5f9' }}>{email}</strong></>}
            {step === 3 && 'Đặt mật khẩu mới cho tài khoản của bạn'}
          </p>
        </div>

        {/* ===== STEP 1: EMAIL ===== */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>Địa chỉ Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  style={{ width: '100%', padding: '12px 14px 12px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '13px', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', margin: 0 }}>
              <Link to="/dang-nhap" style={{ color: '#ef4444', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ArrowLeft size={13} /> Quay lại đăng nhập
              </Link>
            </p>
          </form>
        )}

        {/* ===== STEP 2: OTP ===== */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* OTP inputs */}
            <div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }} onPaste={handleOtpPaste}>
                {otp.map((v, i) => (
                  <input key={i} ref={el => otpRefs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1}
                    value={v}
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
              {/* Timer */}
              {otpExpire > 0 && (
                <p style={{ textAlign: 'center', fontSize: '13px', color: otpExpire < 60 ? '#ef4444' : '#94a3b8', margin: '12px 0 0' }}>
                  ⏱ Mã hết hạn sau: <strong>{formatTime(otpExpire)}</strong>
                </p>
              )}
              {otpExpire === 0 && (
                <p style={{ textAlign: 'center', fontSize: '13px', color: '#ef4444', margin: '12px 0 0' }}>⚠️ Mã OTP đã hết hạn</p>
              )}
            </div>
            <button type="submit" disabled={loading || otp.join('').length < 6}
              style={{ padding: '13px', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: (loading || otp.join('').length < 6) ? 'not-allowed' : 'pointer', opacity: (loading || otp.join('').length < 6) ? 0.6 : 1 }}>
              {loading ? 'Đang xác minh...' : 'Xác minh OTP'}
            </button>
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
              Chưa nhận được mã?{' '}
              {resendCountdown > 0
                ? <span style={{ color: '#94a3b8' }}>Gửi lại sau {resendCountdown}s</span>
                : <button type="button" onClick={handleResend} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Gửi lại mã</button>
              }
            </div>
          </form>
        )}

        {/* ===== STEP 3: NEW PASSWORD ===== */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>Mật khẩu mới</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input type={showPwd ? 'text' : 'password'} required minLength={6} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  style={{ width: '100%', padding: '12px 42px 12px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>Xác nhận mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input type={showCfm ? 'text' : 'password'} required value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  style={{ width: '100%', padding: '12px 42px 12px 40px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${confirmPwd && confirmPwd !== newPwd ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', color: '#f1f5f9', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowCfm(p => !p)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
                  {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPwd && confirmPwd !== newPwd && (
                <p style={{ fontSize: '12px', color: '#ef4444', margin: '6px 0 0' }}>Mật khẩu không khớp</p>
              )}
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '13px', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Đang cập nhật...' : '✅ Đổi mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
