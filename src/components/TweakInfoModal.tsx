'use client'

import { useEffect, useCallback } from 'react'
import { X, Info, Shield, RotateCcw, Zap, AlertTriangle, ChevronRight } from 'lucide-react'
import { getTweakInfo, getTierLabel } from '@/data/tweak-info'
import type { Tweak } from '@/types'

interface TweakInfoModalProps {
  isOpen: boolean
  onClose: () => void
  tweak: Tweak | null
}

export function TweakInfoModal({ isOpen, onClose, tweak }: TweakInfoModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen || !tweak) return null

  const info = getTweakInfo(tweak.id)
  const tierLabel = getTierLabel(tweak.requiredTier)

  const sections = [
    { icon: <Info className="w-3.5 h-3.5" />, label: 'What it does', content: info.description },
    { icon: <ChevronRight className="w-3.5 h-3.5" />, label: 'Technical details', content: info.technicalDetails },
    { icon: <Zap className="w-3.5 h-3.5" />, label: 'Benefits', content: info.benefits },
    { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Risks', content: info.risks },
    { icon: <Shield className="w-3.5 h-3.5" />, label: 'Included in plan', content: `${tierLabel} tier` + (info.plan !== tierLabel ? ` (metadata: ${info.plan})` : '') },
    { icon: <RotateCcw className="w-3.5 h-3.5" />, label: 'Reversible', content: info.reversible ? 'Yes — use the Revert button to restore the original setting.' : 'No — this action cannot be undone automatically.' },
  ].filter(s => s.content && s.content !== 'None.' && s.content !== `${tierLabel} tier` || s.label === 'Included in plan' || s.label === 'Reversible')

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg border border-white/10 bg-[#0a0a0a] fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Info className="w-4 h-4 text-white/70" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-white/90">{tweak.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                  {tweak.category}
                </span>
                <span className="text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                  {tierLabel}
                </span>
                {tweak.impact === 'high' && (
                  <span className="text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                    High Impact
                  </span>
                )}
                {tweak.risk !== 'none' && (
                  <span className="text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(153,153,153,0.06)', color: '#999' }}>
                    {tweak.risk} risk
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-white/30">{section.icon}</span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-white/40">{section.label}</span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed pl-5">{section.content}</p>
            </div>
          ))}

          {/* Gaming impact summary */}
          <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-white/40" />
              <span className="text-[9px] font-bold tracking-wider uppercase text-white/40">Gaming Impact</span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">{tweak.gamingImpact}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5">
          <button onClick={onClose}
            className="w-full py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
