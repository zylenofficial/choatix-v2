'use client'
import { useState, useEffect } from 'react'

export default function Disclaimer({ onAccept }: { onAccept: () => void }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const handleAccept = () => {
    setExiting(true)
    setTimeout(onAccept, 500)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: exiting ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div style={{
        position: 'relative', zIndex: 2, width: '100%', maxWidth: 420, padding: '0 24px',
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <img src="/choatix-logo.png" alt="CHOATIX" style={{
            height: 52, width: 'auto', objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
          }} />
        </div>

        {/* Welcome text */}
        <h1 style={{
          fontSize: 22, fontWeight: 300, color: '#fff',
          letterSpacing: '-0.02em', marginBottom: 8,
        }}>
          Welcome to Choatix
        </h1>
        <p style={{
          fontSize: 12, color: 'rgba(255,255,255,0.35)',
          lineHeight: 1.6, maxWidth: 340, margin: '0 auto 32px',
        }}>
          Gaming optimization for Windows. All changes are safe and can be reverted anytime from the Rollback tab.
        </p>

        {/* Get Started button */}
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
            width: '100%', padding: '14px 0',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, background: 'transparent', color: '#fff',
            fontSize: 12, fontWeight: 600, letterSpacing: 2,
            cursor: 'pointer', transition: 'all 0.25s ease',
          }}
        >
          GET STARTED
        </button>

        <p style={{
          marginTop: 16, fontSize: 9, color: 'rgba(255,255,255,0.15)',
          letterSpacing: 1,
        }}>
          Free tier available · No account required
        </p>
      </div>
    </div>
  )
}
