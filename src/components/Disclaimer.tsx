'use client'
import { useState, useEffect } from 'react'

export default function Disclaimer({ onAccept }: { onAccept: () => void }) {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<'typing' | 'lines' | 'done'>('typing')
  const [typedLines, setTypedLines] = useState(0)
  const [exiting, setExiting] = useState(false)

  const lines = [
    { label: 'NOTICE', text: 'CHOATIX is a system optimization tool for Windows.' },
    { label: 'WARNING', text: 'Modifying system settings carries inherent risk.' },
    { label: 'BACKUP', text: 'Create a restore point before applying tweaks.' },
    { label: 'REVERT', text: 'All changes can be reverted from the Rollback tab.' },
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
      {/* Background effects */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2, maxWidth: 480, width: '100%',
        padding: '0 32px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 48,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.5s 0.3s',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 22, fontWeight: 300, letterSpacing: 12, color: '#fff',
              fontFamily: "'Cascadia Code', 'Consolas', monospace",
            }}>
              CHOATIX
            </div>
            <div style={{
              fontSize: 8, letterSpacing: 5, color: 'rgba(255,255,255,0.2)',
              marginTop: 8,
              fontFamily: "'Cascadia Code', 'Consolas', monospace",
            }}>
              GAMING OPTIMIZER v2.0
            </div>
          </div>
        </div>

        {/* Section label */}
        <div style={{
          fontSize: 8, fontWeight: 600, letterSpacing: 4,
          color: 'rgba(255,255,255,0.25)', marginBottom: 20,
          fontFamily: "'Cascadia Code', 'Consolas', monospace",
        }}>
          DISCLAIMER
        </div>

        {/* Divider */}
        <div style={{
          height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 0,
        }} />

        {/* Lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {lines.map((line, i) => (
            <div key={i} style={{
              display: 'flex', gap: 16, padding: '16px 0',
              borderBottom: i < lines.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              opacity: i < typedLines ? 1 : 0,
              transform: i < typedLines ? 'translateX(0)' : 'translateX(-12px)',
              transition: 'all 0.3s ease-out',
            }}>
              <div style={{
                fontSize: 7, fontWeight: 700, letterSpacing: 2,
                color: line.label === 'WARNING' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                minWidth: 60, paddingTop: 3, flexShrink: 0,
                fontFamily: "'Cascadia Code', 'Consolas', monospace",
              }}>
                {line.label}
              </div>
              <div style={{
                fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)',
                fontFamily: "'Cascadia Code', 'Consolas', monospace",
              }}>
                {i < typedLines ? line.text : ''}
                {i === typedLines && phase === 'typing' && (
                  <span style={{
                    display: 'inline-block', width: 7, height: 14,
                    background: 'rgba(255,255,255,0.5)', marginLeft: 2,
                    animation: 'cursorBlink 0.8s step-end infinite',
                  }} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Button */}
        <div style={{
          marginTop: 40, opacity: phase === 'done' || phase === 'lines' ? 1 : 0,
          transform: phase === 'done' || phase === 'lines' ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.4s ease-out',
        }}>
          <button
            onClick={handleAccept}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.color = '#000'
              e.currentTarget.style.boxShadow = '0 0 40px rgba(255,255,255,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.boxShadow = 'none'
            }}
            style={{
              width: '100%', padding: '16px 0',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent', color: '#fff',
              fontSize: 10, fontWeight: 500, letterSpacing: 6,
              cursor: 'pointer', transition: 'all 0.3s ease',
              fontFamily: "'Cascadia Code', 'Consolas', monospace",
            }}
          >
            CONTINUE
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 24, textAlign: 'center',
          fontSize: 7, letterSpacing: 3, color: 'rgba(255,255,255,0.12)',
          fontFamily: "'Cascadia Code', 'Consolas', monospace",
        }}>
          CONTINUING IMPLIES ACCEPTANCE
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
