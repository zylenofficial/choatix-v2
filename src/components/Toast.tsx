'use client'

import { useState, useCallback, useRef, createContext, useContext } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const ToastContext = createContext<{ addToast: (message: string, type?: Toast['type']) => void }>({ addToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextIdRef = useRef(0)

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = nextIdRef.current++
    setToasts(prev => [...prev.slice(-4), { id, message, type }])
    setTimeout(() => removeToast(id), 3000)
  }, [removeToast])

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
      case 'error': return <AlertCircle className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
      default: return <Info className="w-3.5 h-3.5" style={{ color: 'var(--info)' }} />
    }
  }

  const getColors = (type: Toast['type']) => {
    switch (type) {
      case 'success': return { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)', color: 'var(--success)' }
      case 'error': return { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)', color: 'var(--danger)' }
      default: return { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)', color: 'var(--info)' }
    }
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => {
          const colors = getColors(toast.type)
          return (
            <div key={toast.id} className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm text-[11px] font-medium animate-[slideIn_0.25s_ease-out]"
              style={{
                background: colors.bg,
                color: colors.color,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${colors.border}`,
              }}>
              {getIcon(toast.type)}
              <span className="flex-1">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="opacity-40 hover:opacity-100 transition-opacity ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
