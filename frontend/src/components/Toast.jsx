import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { CheckCircle, X, AlertTriangle, Info, AlertCircle } from 'lucide-react'

const ToastContext = createContext(null)

/**
 * Toast notification system for KOFA.
 * Replaces alert() with styled, auto-dismissing toast messages.
 *
 * Usage:
 *   const { showToast } = useToast()
 *   showToast('Product added!', 'success')
 *   showToast('Failed to save', 'error')
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: { bg: '#ecfdf5', border: '#10b981', text: '#065f46', icon: '#10b981' },
  error:   { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', icon: '#f59e0b' },
  info:    { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: '#3b82f6' },
}

function Toast({ toast, onRemove }) {
  const { type = 'info', message } = toast
  const color = COLORS[type] || COLORS.info
  const Icon = ICONS[type] || Info

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 1rem', borderRadius: '0.75rem',
        background: color.bg, border: `1px solid ${color.border}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        animation: 'slideInRight 0.3s ease-out',
        maxWidth: 400, width: '100%',
      }}
    >
      <Icon size={20} color={color.icon} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '0.875rem', color: color.text, fontWeight: 500 }}>
        {message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 2, display: 'flex', flexShrink: 0,
        }}
      >
        <X size={16} color={color.text} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — fixed top-right */}
      <div
        style={{
          position: 'fixed', top: 16, right: 16,
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
          zIndex: 99999, pointerEvents: 'none',
        }}
      >
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <Toast toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export default ToastProvider
