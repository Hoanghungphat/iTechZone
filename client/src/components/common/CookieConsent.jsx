/**
 * components/common/CookieConsent.jsx
 * Banner hỏi quyền lưu refresh token vào cookie
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, ChevronRight } from 'lucide-react'

const CONSENT_KEY = 'itechzone_cookie_consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (stored === null) {
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept  = () => { localStorage.setItem(CONSENT_KEY, 'true');  setVisible(false) }
  const handleDecline = () => { localStorage.setItem(CONSENT_KEY, 'false'); setVisible(false) }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[420px] z-[9999]"
        >
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Gradient top bar */}
            <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

            <div className="p-4 sm:p-5">
              {/* Close */}
              <button
                onClick={handleDecline}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="flex items-start gap-3 mb-4 pr-6">
                <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Cookie size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                    Cho phép lưu phiên đăng nhập?
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Chúng tôi sẽ lưu một <strong>refresh token</strong> an toàn vào cookie
                    để bạn không cần đăng nhập lại trong <strong>7 ngày</strong>.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleAccept}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all"
                >
                  Đồng ý <ChevronRight size={15} />
                </button>
                <button
                  onClick={handleDecline}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all"
                >
                  Từ chối
                </button>
              </div>

              <p className="text-[10px] sm:text-[11px] text-gray-400 mt-2.5 text-center">
                Từ chối → session kết thúc sau 15 phút không hoạt động.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
