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
    setTimeout(() => removeToast(id), 3500)
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
      case 'success': return { bg: 'rgba(10,10,10,0.85)', border: 'rgba(74,222,128,0.15)', color: 'var(--success)', glow: 'rgba(74,222,128,0.08)' }
      case 'error': return { bg: 'rgba(10,10,10,0.85)', border: 'rgba(248,113,113,0.15)', color: 'var(--danger)', glow: 'rgba(248,113,113,0.08)' }
      default: return { bg: 'rgba(10,10,10,0.85)', border: 'rgba(96,165,250,0.15)', color: 'var(--info)', glow: 'rgba(96,165,250,0.08)' }
    }
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => {
          const colors = getColors(toast.type)
          return (
            <div key={toast.id}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-medium"
              style={{
                background: colors.bg,
                color: colors.color,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${colors.border}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                backdropFilter: 'blur(16px) saturate(1.3)',
                animation: 'springIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: colors.glow }}>
                {getIcon(toast.type)}
              </div>
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
