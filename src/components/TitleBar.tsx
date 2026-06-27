'use client'

import { useState, useEffect } from 'react'
import { Minus, Square, X } from 'lucide-react'

export default function TitleBar() {
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    setIsElectron(!!window.electronAPI?.isElectron)
  }, [])

  if (!isElectron) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 h-8 flex items-center justify-between z-[9999] select-none"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <div className="flex-1 flex items-center pl-3">
        <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          CHOATIX
        </span>
      </div>
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => window.electronAPI?.minimize()}
          className="h-8 w-12 flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => window.electronAPI?.maximize()}
          className="h-8 w-12 flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={() => window.electronAPI?.close()}
          className="h-8 w-12 flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
