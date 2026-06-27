'use client'
import { useState, useEffect } from 'react'

export default function Disclaimer({ onAccept }: { onAccept: () => void }) {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<'typing' | 'lines' | 'done'>('typing')
  const [typedLines, setTypedLines] = useState(0)
  const [exiting, setExiting] = useState(false)

  const lines = [
    { label: 'NOTICE', text: 'CHOATIX is a system optimization tool.' },
    { label: 'WARNING', text: 'Modifying system settings carries inherent risk.' },
    { label: 'BACKUP', text: 'Always create a restore point before applying tweaks.' },
    { label: 'LIABILITY', text: 'Use at your own discretion. We are not responsible for damage.' },
    { label: 'LICENSE', text: 'This software is provided as-is without warranty.' },
  ]

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!visible || phase !== 'typing') return
    if (typedLines >= lines.length) {
      setTimeout(() => setPhase('lines'), 600)
      return
    }
    const t = setTimeout(() => setTypedLines(typedLines + 1), 180)
    return () => clearTimeout(t)
  }, [visible, phase, typedLines])

  const handleAccept = () => {
    setExiting(true)
    setTimeout(onAccept, 600)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: exiting ? 0 : 1,
      transition: 'opacity 0.6s ease-out',
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />

      {/* Scan lines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2, maxWidth: 520, width: '100%',
        padding: '0 24px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s ease-out',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s 0.2s',
        }}>
          <div style={{
            width: 32, height: 32, border: '1.5px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff',
          }}>
            !
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 4, color: '#fff' }}>
              DISCLAIMER
            </div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              TERMS OF USE
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.2), transparent)',
          marginBottom: 24,
        }} />

        {/* Lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {lines.map((line, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '12px 0',
              borderBottom: i < lines.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              opacity: i < typedLines ? 1 : 0,
              transform: i < typedLines ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'all 0.3s ease-out',
            }}>
              <div style={{
                fontSize: 8, fontWeight: 700, letterSpacing: 2,
                color: line.label === 'WARNING' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                minWidth: 52, paddingTop: 2, flexShrink: 0,
              }}>
                [{line.label}]
              </div>
              <div style={{
                fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)',
                fontFamily: "'Cascadia Code', 'Consolas', monospace",
              }}>
                {i < typedLines ? line.text : ''}
                {i === typedLines && phase === 'typing' && (
                  <span style={{
                    display: 'inline-block', width: 7, height: 14,
                    background: 'rgba(255,255,255,0.6)', marginLeft: 2,
                    animation: 'cursorBlink 0.8s step-end infinite',
                  }} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Button */}
        <div style={{
          marginTop: 32, opacity: phase === 'done' || phase === 'lines' ? 1 : 0,
          transform: phase === 'done' || phase === 'lines' ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease-out',
        }}>
          <button
            onClick={handleAccept}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.color = '#000'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.boxShadow = 'none'
            }}
            style={{
              width: '100%', padding: '14px 0',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'transparent', color: '#fff',
              fontSize: 11, fontWeight: 600, letterSpacing: 4,
              cursor: 'pointer', transition: 'all 0.25s ease',
              fontFamily: "'Cascadia Code', 'Consolas', monospace",
            }}
          >
            I UNDERSTAND
          </button>
        </div>

        {/* Bottom line */}
        <div style={{
          marginTop: 20, textAlign: 'center',
          fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.15)',
        }}>
          CONTINUING IMPLIES ACCEPTANCE OF THESE TERMS
        </div>
      </div>

      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
