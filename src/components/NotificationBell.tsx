'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, Check, Trash2, X } from 'lucide-react'
import { useStore } from '@/store/useStore'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  timestamp: number
  read: boolean
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { notifications, markNotificationRead, clearNotifications } = useStore()
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const formatTime = useCallback((ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
    return Math.floor(diff / 86400000) + 'd ago'
  }, [])

  const getColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'success': return 'rgba(74,222,128,0.12)'
      case 'error': return 'rgba(248,113,113,0.12)'
      case 'warning': return 'rgba(251,191,36,0.12)'
      default: return 'rgba(96,165,250,0.12)'
    }
  }

  const getDot = (type: AppNotification['type']) => {
    switch (type) {
      case 'success': return '#4ade80'
      case 'error': return '#f87171'
      case 'warning': return '#fbbf24'
      default: return '#60a5fa'
    }
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/5 transition-all duration-150 relative"
        style={{ color: 'var(--text-muted)' }}>
        <Bell className="w-3.5 h-3.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[7px] font-bold px-1"
            style={{ background: '#f87171', color: '#fff' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-72 rounded-xl overflow-hidden spring-in" style={{
          background: 'rgba(12,12,12,0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          zIndex: 100,
        }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[11px] font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>Notifications</span>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <button onClick={clearNotifications}
                  className="p-1 rounded-md hover:bg-white/5 transition-all duration-150"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-white/5 transition-all duration-150"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No notifications</p>
              </div>
            ) : (
              notifications.slice().reverse().map(n => (
                <div key={n.id}
                  onClick={() => !n.read && markNotificationRead(n.id)}
                  className="px-4 py-3 flex items-start gap-3 cursor-pointer transition-all duration-150 hover:bg-white/[0.02]"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{
                    background: n.read ? 'transparent' : getDot(n.type),
                    boxShadow: n.read ? 'none' : `0 0 6px ${getDot(n.type)}40`,
                  }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold truncate" style={{ color: n.read ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                        {n.title}
                      </span>
                    </div>
                    <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {n.message}
                    </p>
                    <span className="text-[8px] mt-1 block" style={{ color: 'rgba(255,255,255,0.15)' }}>
                      {formatTime(n.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
