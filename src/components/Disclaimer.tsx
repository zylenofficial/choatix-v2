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
    setTimeout(onAccept, 600)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: exiting ? 0 : 1,
      transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: exiting ? 'blur(0px)' : 'blur(2px)',
    }}>
      {/* Animated grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.5s ease',
      }} />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 2s ease',
      }} />

      <div style={{
        position: 'relative', zIndex: 2, width: '100%', maxWidth: 420, padding: '0 24px',
        textAlign: 'center',
        opacity: visible && !exiting ? 1 : 0,
        transform: visible && !exiting ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Logo with glow */}
        <div style={{ marginBottom: 32, position: 'relative', display: 'inline-block' }}>
          <div style={{
            position: 'absolute', inset: -20,
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <img src="/choatix-logo.png" alt="CHOATIX" style={{
            height: 52, width: 'auto', objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
            position: 'relative',
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

        {/* Get Started button with ripple */}
        <button
          onClick={handleAccept}
          className="ripple"
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fff'
            e.currentTarget.style.color = '#000'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,255,255,0.15)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
          style={{
            width: '100%', padding: '14px 0',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, background: 'transparent', color: '#fff',
            fontSize: 12, fontWeight: 600, letterSpacing: 2,
            cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
