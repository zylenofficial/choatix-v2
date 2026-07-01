'use client'
import { useState, useEffect } from 'react'

export default function Disclaimer({ onAccept }: { onAccept: () => void }) {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<'enter' | 'lines' | 'done'>('enter')
  const [showLines, setShowLines] = useState(0)
  const [exiting, setExiting] = useState(false)

  const lines = [
    { icon: '⚠', text: 'CHOATIX is a system optimization tool for Windows.' },
    { icon: '⚠', text: 'Modifying system settings carries inherent risk.' },
    { icon: '↺', text: 'Create a restore point before applying tweaks.' },
    { icon: '✓', text: 'All changes can be reverted from the Rollback tab.' },
    { icon: '✕', text: 'We are not responsible for any damage caused by misuse.' },
    { icon: '—', text: 'This software is provided as-is without warranty.' },
  ]

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!visible || phase !== 'enter') return
    const t = setTimeout(() => setPhase('lines'), 400)
    return () => clearTimeout(t)
  }, [visible, phase])

  useEffect(() => {
    if (phase !== 'lines') return
    if (showLines >= lines.length) {
      setTimeout(() => setPhase('done'), 500)
      return
    }
    const t = setTimeout(() => setShowLines(showLines + 1), 200)
    return () => clearTimeout(t)
  }, [phase, showLines])

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
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Center content */}
      <div style={{
        position: 'relative', zIndex: 2, width: '100%', maxWidth: 500, padding: '0 24px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40, display: 'flex', justifyContent: 'center' }}>
          <img src="/choatix-logo.png" alt="CHOATIX" style={{
            height: 56, width: 'auto', objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.6s 0.2s',
          }} />
        </div>

        {/* Warning box */}
        <div style={{
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.015)',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
              animation: 'dotPulse 2s ease-in-out infinite',
            }} />
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: 3,
              color: 'rgba(255,255,255,0.3)',
              fontFamily: "'Cascadia Code', 'Consolas', monospace",
            }}>
              BEFORE YOU CONTINUE
            </span>
          </div>

          {/* Lines */}
          <div style={{ padding: '4px 0' }}>
            {lines.map((line, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 20px',
                opacity: i < showLines ? 1 : 0,
                transform: i < showLines ? 'translateX(0)' : 'translateX(-16px)',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: `${i * 40}ms`,
              }}>
                <span style={{
                  fontSize: 11, width: 16, textAlign: 'center',
                  color: 'rgba(255,255,255,0.2)',
                  fontFamily: "'Cascadia Code', 'Consolas', monospace",
                }}>
                  {line.icon}
                </span>
                <span style={{
                  fontSize: 11.5, lineHeight: 1.5,
                  color: 'rgba(255,255,255,0.45)',
                  fontFamily: "'Cascadia Code', 'Consolas', monospace",
                }}>
                  {line.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Button */}
        <div style={{
          marginTop: 24,
          opacity: phase === 'done' ? 1 : 0,
          transform: phase === 'done' ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <button
            onClick={handleAccept}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.color = '#000'
              e.currentTarget.style.borderColor = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
            }}
            style={{
              width: '100%', padding: '14px 0',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12, background: 'transparent', color: '#fff',
              fontSize: 10, fontWeight: 600, letterSpacing: 5,
              cursor: 'pointer', transition: 'all 0.25s ease',
              fontFamily: "'Cascadia Code', 'Consolas', monospace",
            }}
          >
            I UNDERSTAND
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 16, textAlign: 'center',
          fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.1)',
          fontFamily: "'Cascadia Code', 'Consolas', monospace",
        }}>
          CONTINUING IMPLIES ACCEPTANCE
        </div>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
