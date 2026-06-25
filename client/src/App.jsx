/**
 * App.jsx — Entry point của React App
 * Setup: Router, Toast, Global providers
 */
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'

import AppRoutes from '@/routes'
import useThemeStore from '@/store/useThemeStore'
import CookieConsent from '@/components/common/CookieConsent'

function ThemeInitializer() {
  const { initTheme } = useThemeStore()
  useEffect(() => { initTheme() }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Khởi tạo theme */}
      <ThemeInitializer />

      {/* Cookie Consent Banner */}
      <CookieConsent />

      {/* Routes */}
      <AppRoutes />

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          className: '',
          style: {
            borderRadius: '16px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            padding: '12px 16px',
            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.3)',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: 'white' },
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
            },
          },
          error: {
            iconTheme: { primary: '#e51c1c', secondary: 'white' },
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
            },
          },
        }}
      />
    </BrowserRouter>
  )
}
