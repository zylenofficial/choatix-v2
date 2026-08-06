'use client'
import { useState, useEffect, useRef } from 'react'

export default function Disclaimer({ onAccept }: { onAccept: () => void }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const handleAccept = () => {
    setExiting(true)
    timerRef.current = setTimeout(onAccept, 500)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: exiting ? 0 : 1,
      transition: 'opacity 0.5s ease',
    }}>
      <div style={{
        position: 'relative', width: '100%', maxWidth: 360, padding: '0 24px',
        textAlign: 'center',
        opacity: visible && !exiting ? 1 : 0,
        transform: visible && !exiting ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ marginBottom: 28, display: 'inline-block' }}>
          <img src="/choatix-logo.png" alt="CHOATIX" style={{
            height: 44, width: 'auto', objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
          }} />
        </div>

        <h1 style={{
          fontSize: 18, fontWeight: 300, color: '#fff',
          letterSpacing: '-0.01em', marginBottom: 10,
        }}>
          Welcome to Choatix
        </h1>
        <p style={{
          fontSize: 11, color: 'rgba(255,255,255,0.3)',
          lineHeight: 1.6, maxWidth: 300, margin: '0 auto 28px',
        }}>
          Gaming optimization for Windows. All changes are safe and can be reverted anytime from the Rollback tab.
        </p>

        <button
          onClick={handleAccept}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fff'
            e.currentTarget.style.color = '#000'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#fff'
          }}
          style={{
            width: '100%', padding: '13px 0',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10, background: 'transparent', color: '#fff',
            fontSize: 11, fontWeight: 600, letterSpacing: 2,
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
        >
          GET STARTED
        </button>

        <p style={{
          marginTop: 14, fontSize: 8, color: 'rgba(255,255,255,0.12)',
          letterSpacing: 1,
        }}>
          Free tier available · No account required
        </p>
      </div>
    </div>
  )
}
