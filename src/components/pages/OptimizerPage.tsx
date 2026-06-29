'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { Zap, Lock, CheckCircle2, Loader2, XCircle, ShieldAlert, RotateCcw, Shield, Cpu, Monitor, Wifi, MousePointer, HardDrive, Volume2, Power, Gamepad2, Gauge, ArrowRight } from 'lucide-react'
import { canAccessTier } from '@/lib/featureAccess'
import { availableTweaks } from '@/data/tweaks'
import { createRollbackEntry } from '@/lib/tweaks'
import { useToast } from '@/components/Toast'
import type { Tweak, TweakCategory } from '@/types'

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
  system: { label: 'System', icon: <Shield className="w-4 h-4" />, desc: 'Power, game mode, visual effects' },
  cpu: { label: 'CPU', icon: <Cpu className="w-4 h-4" />, desc: 'Core parking, SMT, priority' },
  memory: { label: 'Memory', icon: <Gauge className="w-4 h-4" />, desc: 'RAM cleanup, pagefile, prefetch' },
  nvidia: { label: 'NVIDIA', icon: <Monitor className="w-4 h-4" />, desc: 'GPU power, V-Sync, latency' },
  amd: { label: 'AMD', icon: <Monitor className="w-4 h-4" />, desc: 'Radeon power, Anti-Lag' },
  intel: { label: 'Intel', icon: <Cpu className="w-4 h-4" />, desc: 'Intel GPU power settings' },
  network: { label: 'Network', icon: <Wifi className="w-4 h-4" />, desc: 'DNS, throttling, TCP' },
  mouse: { label: 'Mouse', icon: <MousePointer className="w-4 h-4" />, desc: 'Acceleration, raw input' },
  usb: { label: 'USB', icon: <Power className="w-4 h-4" />, desc: 'Selective suspend' },
  storage: { label: 'Storage', icon: <HardDrive className="w-4 h-4" />, desc: 'TRIM, NVMe, write cache' },
  windows: { label: 'Windows', icon: <Gamepad2 className="w-4 h-4" />, desc: 'Explorer, animations, search' },
  debloat: { label: 'Debloat', icon: <Gauge className="w-4 h-4" />, desc: 'Startup, telemetry, services' },
  gaming: { label: 'Gaming', icon: <Gamepad2 className="w-4 h-4" />, desc: 'Game-specific optimizations' },
  audio: { label: 'Audio', icon: <Volume2 className="w-4 h-4" />, desc: 'Audio enhancements' },
  services: { label: 'Services', icon: <Power className="w-4 h-4" />, desc: 'Service presets' },
}

const CATEGORY_ORDER: TweakCategory[] = [
  'system', 'cpu', 'memory', 'nvidia', 'amd', 'intel',
  'network', 'mouse', 'usb', 'storage',
  'windows', 'debloat', 'gaming', 'audio', 'services',
]

function TweakRow({ tweak, isApplied, isFailed, isApplying, isReverting, hasAccess, onApply, onRevert }: {
  tweak: Tweak; isApplied: boolean; isFailed: boolean; isApplying: boolean; isReverting: boolean; hasAccess: boolean; onApply: () => void; onRevert: () => void
}) {
  const riskColor = tweak.risk === 'medium' ? '#999' : tweak.risk === 'low' ? '#ccc' : '#666'

  if (!hasAccess) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all opacity-40" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
        <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] truncate">{tweak.name}</div>
          <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{tweak.description}</div>
        </div>
        <span className="text-[7px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-lg shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>
          {tweak.requiredTier}
        </span>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
      style={{
        background: isApplied ? 'rgba(255,255,255,0.04)' : isFailed ? 'rgba(153,153,153,0.03)' : 'var(--bg-tertiary)',
        border: `1px solid ${isApplied ? 'rgba(255,255,255,0.1)' : isFailed ? 'rgba(153,153,153,0.1)' : 'var(--border-subtle)'}`,
      }}>
      {/* Status icon */}
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
        {isApplied ? (
          <CheckCircle2 className="w-4 h-4 text-white" />
        ) : isFailed ? (
          <XCircle className="w-4 h-4 text-[var(--danger)]" />
        ) : isApplying ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : null}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-white truncate">{tweak.name}</div>
        <div className="text-[9px] text-[var(--text-tertiary)] mt-0.5 truncate">{tweak.description}</div>
      </div>

      {/* Impact + Risk badges */}
      <div className="flex items-center gap-1.5 shrink-0">
        {tweak.impact === 'high' && (
          <span className="text-[7px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
            High Impact
          </span>
        )}
        {tweak.risk !== 'none' && (
          <span className="text-[7px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-lg" style={{ background: `${riskColor}10`, color: riskColor }}>
            {tweak.risk} risk
          </span>
        )}
      </div>

      {/* Gaming impact */}
      <div className="text-[9px] text-right max-w-[130px] truncate shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {tweak.gamingImpact}
      </div>

      {/* Actions */}
      <div className="shrink-0">
        {isApplied ? (
          <button onClick={onRevert} disabled={isReverting}
            className="px-3 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1.5 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)' }}>
            <RotateCcw className="w-3 h-3" />
            Revert
          </button>
        ) : (
          <button onClick={onApply} disabled={isApplying || isFailed}
            className="px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all duration-200"
            style={{
              background: isFailed ? 'var(--danger-dim)' : '#fff',
              color: isFailed ? 'var(--danger)' : '#000',
              opacity: isApplying ? 0.5 : 1,
            }}>
            {isApplying ? 'Applying...' : isFailed ? 'Failed — Retry' : 'Apply'}
          </button>
        )}
      </div>
    </div>
  )
}

export function OptimizerPage() {
  const { license, appliedTweaks, setAppliedTweaks, addAppliedTweak, addRollbackEntry } = useStore()
  const { addToast } = useToast()
  const [applying, setApplying] = useState<string | null>(null)
  const [reverting, setReverting] = useState<string | null>(null)
  const [failed, setFailed] = useState<Set<string>>(new Set())
  const [isRunningAsAdmin, setIsRunningAsAdmin] = useState<boolean | null>(null)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI?.isAdmin().then(setIsRunningAsAdmin)
  }, [])

  const appliedSet = new Set(appliedTweaks)

  const tweaksByCategory = useMemo(() => CATEGORY_ORDER.map(cat => ({
    category: cat,
    meta: CATEGORY_META[cat] || { label: cat, icon: <Shield className="w-4 h-4" />, desc: '' },
    tweaks: availableTweaks.filter(t => t.category === cat),
  })).filter(g => g.tweaks.length > 0), [])

  const totalApplied = appliedTweaks.length
  const totalTweaks = availableTweaks.length
  const totalAccessible = availableTweaks.filter(t => canAccessTier(license.tier, t.requiredTier)).length

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
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
                <Zap className="w-6 h-6 text-black" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Optimizer</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {totalTweaks} total • {totalAccessible} available • {totalApplied} applied
              </p>
            </div>
          </div>
          <button onClick={handleApplyAll} disabled={applying !== null}
            className="h-11 px-6 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50 btn-primary">
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {applying ? 'Optimizing...' : 'Optimize All'}
          </button>
        </div>

        {/* Admin warning */}
        {isRunningAsAdmin === false && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl fade-in" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ShieldAlert className="w-4 h-4 text-[var(--warning)] shrink-0" />
            <div>
              <div className="text-[11px] font-semibold text-[var(--warning)]">Not running as administrator</div>
              <div className="text-[9px] text-[var(--text-muted)] mt-0.5">Some tweaks require admin. Restart the app to elevate.</div>
            </div>
          </div>
        )}

        {/* Progress overview */}
        <div className="rounded-2xl p-5 fade-in" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-medium">Optimization Progress</div>
            <div className="text-xs font-bold text-white">{totalApplied} / {totalTweaks}</div>
          </div>
          <div className="h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{
              width: `${totalTweaks > 0 ? (totalApplied / totalTweaks) * 100 : 0}%`,
              background: '#fff',
            }} />
          </div>
        </div>

        {/* Category grid */}
        <div className="space-y-2 stagger">
          {tweaksByCategory.map(({ category, meta, tweaks }) => {
            const appliedCount = tweaks.filter(t => appliedSet.has(t.id)).length
            const accessibleCount = tweaks.filter(t => canAccessTier(license.tier, t.requiredTier)).length
            const isOpen = expandedCat === category
            const progress = tweaks.length > 0 ? (appliedCount / tweaks.length) * 100 : 0

            return (
              <div key={category} className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{ background: 'var(--bg-secondary)', border: `1px solid ${isOpen ? 'var(--border-default)' : 'var(--border-subtle)'}` }}>
                {/* Category header */}
                <button onClick={() => setExpandedCat(isOpen ? null : category)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                      {meta.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{meta.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{meta.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-white">{appliedCount}/{tweaks.length}</div>
                      <div className="text-[8px] text-[var(--text-muted)] mt-0.5">{accessibleCount} available</div>
                    </div>
                    {/* Mini progress */}
                    <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#fff' }} />
                    </div>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </div>
                  </div>
                </button>

                {/* Tweaks */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-1.5 stagger" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {tweaks.map(tweak => {
                      const hasAccess = canAccessTier(license.tier, tweak.requiredTier)
                      return (
                        <TweakRow
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
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
