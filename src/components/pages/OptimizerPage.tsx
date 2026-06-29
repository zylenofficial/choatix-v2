'use client'

import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { Zap, Lock, CheckCircle2, Loader2, XCircle, ShieldAlert, RotateCcw } from 'lucide-react'
import { canAccessTier } from '@/lib/featureAccess'
import { availableTweaks } from '@/data/tweaks'
import { createRollbackEntry } from '@/lib/tweaks'
import { useToast } from '@/components/Toast'
import type { Tweak, TweakCategory } from '@/types'

const CATEGORY_META: Record<string, { color: string; label: string; icon: string }> = {
  system: { color: '#ffffff', label: 'System', icon: '⚙' },
  nvidia: { color: '#cccccc', label: 'NVIDIA', icon: '🎮' },
  network: { color: '#cccccc', label: 'Network', icon: '🌐' },
  debloat: { color: '#cccccc', label: 'Debloat', icon: '🧹' },
  mouse: { color: '#ffffff', label: 'Mouse', icon: '🖱' },
  amd: { color: '#ffffff', label: 'AMD', icon: '🔴' },
  intel: { color: '#ffffff', label: 'Intel', icon: '🔵' },
  cpu: { color: '#ffffff', label: 'CPU', icon: '💻' },
  memory: { color: '#ffffff', label: 'RAM', icon: '🧠' },
  storage: { color: '#cccccc', label: 'Storage', icon: '💾' },
  windows: { color: '#ffffff', label: 'Windows', icon: '🪟' },
  gaming: { color: '#cccccc', label: 'Gaming', icon: '🎯' },
  audio: { color: '#ffffff', label: 'Audio', icon: '🔊' },
  usb: { color: '#ffffff', label: 'USB', icon: '🔌' },
  services: { color: '#64748b', label: 'Services', icon: '⚡' },
}

const CATEGORY_ORDER: TweakCategory[] = [
  'system', 'cpu', 'memory', 'nvidia', 'amd', 'intel',
  'network', 'mouse', 'usb', 'storage',
  'windows', 'debloat', 'gaming', 'audio', 'services',
]

function TweakButton({ tweak, isApplied, isFailed, isApplying, isReverting, hasAccess, onApply, onRevert }: {
  tweak: Tweak; isApplied: boolean; isFailed: boolean; isApplying: boolean; isReverting: boolean; hasAccess: boolean; onApply: () => void; onRevert: () => void
}) {
  if (!hasAccess) {
    return (
      <div className="px-3 py-2 rounded-lg text-[10px] font-medium flex items-center gap-1.5 opacity-40 cursor-not-allowed"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
        <Lock className="w-3 h-3" />
        {tweak.name}
      </div>
    )
  }

  if (isApplied) {
    return (
      <div className="px-3 py-2 rounded-lg text-[10px] font-medium flex items-center gap-1.5"
        style={{ background: 'var(--success-dim)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--success)' }}>
        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
        <span className="flex-1 truncate">{tweak.name}</span>
        <button onClick={onRevert} disabled={isReverting}
          className="p-0.5 rounded hover:bg-white/10 flex-shrink-0" title="Revert">
          <RotateCcw className="w-3 h-3" style={{ color: 'var(--warning)' }} />
        </button>
      </div>
    )
  }

  if (isFailed) {
    return (
      <button onClick={onApply} disabled={isApplying}
        className="px-3 py-2 rounded-lg text-[10px] font-medium flex items-center gap-1.5 text-left transition-all hover:border-red-500/20"
        style={{ background: 'var(--danger-dim)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--danger)' }}>
        <XCircle className="w-3 h-3" />
        {tweak.name}
      </button>
    )
  }

  return (
    <button onClick={onApply} disabled={isApplying}
      className="px-3 py-2 rounded-lg text-[10px] font-medium flex items-center gap-1.5 text-left transition-all hover:border-white/10 group"
      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
      {isApplying ? (
        <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--accent)' }} />
      ) : (
        <Zap className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
      )}
      {tweak.name}
    </button>
  )
}

export function OptimizerPage() {
  const { license, advisorResult, advisorDismissedIssues, appliedTweaks, setAppliedTweaks, addAppliedTweak, addRollbackEntry } = useStore()
  const { addToast } = useToast()
  const [applying, setApplying] = useState<string | null>(null)
  const [reverting, setReverting] = useState<string | null>(null)
  const [failed, setFailed] = useState<Set<string>>(new Set())
  const [isRunningAsAdmin, setIsRunningAsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    window.electronAPI?.isAdmin().then(setIsRunningAsAdmin)
  }, [])

  const issues = advisorResult?.issues.filter(i => !advisorDismissedIssues.includes(i.id)) || []
  const appliedSet = new Set(appliedTweaks)

  const tweaksByCategory = CATEGORY_ORDER.map(cat => ({
    category: cat,
    meta: CATEGORY_META[cat] || { color: 'var(--text-muted)', label: cat, icon: '⚙' },
    tweaks: availableTweaks.filter(t => t.category === cat),
  })).filter(g => g.tweaks.length > 0)

  const handleApply = useCallback(async (tweakId: string) => {
    if (!window.electronAPI) return
    setApplying(tweakId)
    try {
      const result = await window.electronAPI.applyTweak(tweakId)
      const tweak = availableTweaks.find(t => t.id === tweakId)
      if (result.success) {
        addAppliedTweak(tweakId)
        addRollbackEntry(createRollbackEntry(tweakId))
        setFailed(prev => { const n = new Set(prev); n.delete(tweakId); return n })
        addToast(`${tweak?.name || tweakId} applied`, 'success')
      } else {
        setFailed(prev => new Set(prev).add(tweakId))
        addToast(`${tweak?.name || tweakId} failed`, 'error')
      }
    } catch (e: any) {
      setFailed(prev => new Set(prev).add(tweakId))
      addToast(`Error: ${e.message}`, 'error')
    }
    setApplying(null)
  }, [addToast, addAppliedTweak])

  const handleApplyAll = useCallback(async () => {
    if (!window.electronAPI) return
    let successCount = 0
    let failCount = 0
    for (const tweak of availableTweaks) {
      if (canAccessTier(license.tier, tweak.requiredTier) && !appliedSet.has(tweak.id)) {
        setApplying(tweak.id)
        try {
          const result = await window.electronAPI.applyTweak(tweak.id)
          if (result.success) {
            addAppliedTweak(tweak.id)
            setFailed(prev => { const n = new Set(prev); n.delete(tweak.id); return n })
            successCount++
          } else {
            setFailed(prev => new Set(prev).add(tweak.id))
            failCount++
          }
        } catch {
          setFailed(prev => new Set(prev).add(tweak.id))
          failCount++
        }
      }
    }
    setApplying(null)
    addToast(`Done: ${successCount} applied, ${failCount} failed`, successCount > 0 ? 'success' : 'error')
  }, [license.tier, appliedSet, addToast, addAppliedTweak])

  const handleRevert = useCallback(async (tweakId: string) => {
    if (!window.electronAPI) return
    setReverting(tweakId)
    try {
      const result = await window.electronAPI.restoreTweak(tweakId)
      if (result.success) {
        setAppliedTweaks(appliedTweaks.filter(id => id !== tweakId))
        addToast(`Reverted`, 'success')
      } else {
        addToast(`Failed to revert`, 'error')
      }
    } catch (e: any) {
      addToast(`Error: ${e.message}`, 'error')
    }
    setReverting(null)
  }, [appliedTweaks, setAppliedTweaks, addToast])

  return (
    <div className="p-5 lg:p-6 space-y-5 fade-in overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Optimizer</h1>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {availableTweaks.length} optimizations · {appliedTweaks.length} applied
          </p>
        </div>
        <button
          onClick={handleApplyAll}
          disabled={applying !== null}
          className="h-10 px-6 rounded-xl text-[11px] font-bold flex items-center gap-2 disabled:opacity-50 btn-primary"
        >
          {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {applying ? 'Optimizing...' : 'Optimize All'}
        </button>
      </div>

      {/* Admin warning */}
      {isRunningAsAdmin === false && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[11px] font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--warning)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Not running as admin. Some tweaks may fail.</span>
        </div>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 stagger">
        {tweaksByCategory.map(({ category, meta, tweaks }) => {
          const appliedCount = tweaks.filter(t => appliedSet.has(t.id)).length

          return (
            <div key={category} className="card-widget overflow-hidden card-glow">
              {/* Category header */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px]" style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}18` }}>
                    {meta.icon}
                  </div>
                  <span className="text-[11px] font-bold tracking-wide" style={{ color: meta.color }}>{meta.label}</span>
                </div>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${meta.color}10`, color: meta.color }}>
                  {appliedCount}/{tweaks.length}
                </span>
              </div>

              {/* Tweaks */}
              <div className="p-2.5 grid grid-cols-2 gap-1.5">
                {tweaks.map(tweak => {
                  const hasAccess = canAccessTier(license.tier, tweak.requiredTier)
                  return (
                    <TweakButton
                      key={tweak.id}
                      tweak={tweak}
                      isApplied={appliedSet.has(tweak.id)}
                      isFailed={failed.has(tweak.id)}
                      isApplying={applying === tweak.id}
                      isReverting={reverting === tweak.id}
                      hasAccess={hasAccess}
                      onApply={() => handleApply(tweak.id)}
                      onRevert={() => handleRevert(tweak.id)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
