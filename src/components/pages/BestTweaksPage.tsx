'use client'

import { useState, useCallback, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { availableTweaks } from '@/data/tweaks'
import { canAccessTier } from '@/lib/featureAccess'
import { createRollbackEntry } from '@/lib/tweaks'
import { useToast } from '@/components/Toast'
import { Zap, Lock, CheckCircle2, Loader2, Shield, Cpu, Mouse, Wifi, HardDrive, Monitor, Volume2, Power, Sparkles, ArrowRight, RotateCcw, Info } from 'lucide-react'
import { LicenseTier } from '@/types'
import { TweakInfoModal } from '@/components/TweakInfoModal'
import type { Tweak } from '@/types'

interface TweakGroup {
  id: string
  label: string
  description: string
  icon: any
  tweaks: string[]
}

const GROUPS: TweakGroup[] = [
  {
    id: 'essential',
    label: 'Essential',
    description: 'Must-have optimizations for every gamer. Free and safe.',
    icon: Shield,
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-fullscreen-opt',
      'sys-disk-cleanup', 'cpu-core-parking-disable',
      'mouse-disable-acceleration', 'nv-disable-vsync',
      'net-optimize-dns',
      'storage-ssd-optimization', 'storage-trim-optimization',
      'audio-disable-enhancements', 'usb-selective-suspend-disable',
      'windows-explorer-optimization',
      'keyboard-disable-filter', 'keyboard-usb-power-mgmt',
    ],
  },
  {
    id: 'pro',
    label: 'Pro Boost',
    description: 'Advanced tweaks for competitive edge. Unlock with Pro key.',
    icon: Cpu,
    tweaks: [
      'sys-cpu-priority',
      'nv-low-latency', 'nv-texture-filtering',
      'net-reduce-congestion',
      'storage-nvme-optimization', 'storage-prefetch-manager',
      'audio-usb-optimization',
    ],
  },
  {
    id: 'premium',
    label: 'Premium Elite',
    description: 'Maximum performance with full system restore. Premium only.',
    icon: Sparkles,
    tweaks: [
      'nv-hardware-scheduling',
      'memory-working-set',
    ],
  },
]

function TweakRow({ tweak, isApplied, isApplying, isReverting, hasAccess, onApply, onRevert, onInfo }: {
  tweak: Tweak; isApplied: boolean; isApplying: boolean; isReverting: boolean; hasAccess: boolean; onApply: () => void; onRevert: () => void; onInfo: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
      style={{
        background: isApplied ? 'rgba(255,255,255,0.04)' : 'var(--bg-tertiary)',
        border: `1px solid ${isApplied ? 'rgba(255,255,255,0.1)' : 'var(--border-subtle)'}`,
        opacity: !hasAccess ? 0.4 : 1,
      }}>
      {/* Status */}
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
        {isApplied ? (
          <CheckCircle2 className="w-4 h-4 text-white" />
        ) : isApplying ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : !hasAccess ? (
          <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        ) : (
          <button onClick={onApply} className="w-5 h-5 rounded-full border transition-all hover:scale-110 hover:border-white/40" style={{ borderColor: 'var(--border-strong)' }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold truncate" style={{ color: hasAccess ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {tweak.name}
          </span>
          {!hasAccess && (
            <span className="text-[7px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-lg shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>
              {tweak.requiredTier}
            </span>
          )}
        </div>
        <div className="text-[9px] truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{tweak.description}</div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {tweak.impact === 'high' && (
          <span className="text-[7px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
            High
          </span>
        )}
        {tweak.risk !== 'none' && (
          <span className="text-[7px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-lg"
            style={{ background: tweak.risk === 'medium' ? 'rgba(153,153,153,0.06)' : 'rgba(204,204,204,0.06)', color: tweak.risk === 'medium' ? '#999' : '#ccc' }}>
            {tweak.risk}
          </span>
        )}
      </div>

      {/* Gaming effect */}
      <div className="text-[9px] text-right max-w-[130px] truncate flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
        {tweak.gamingImpact}
      </div>

      {/* Info */}
      <button onClick={onInfo} className="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg transition-all hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.15)' }} title="Tweak info">
        <Info className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.6)' }} />
      </button>

      {/* Actions */}
      {hasAccess && !isApplying && (
        isApplied ? (
          <button onClick={onRevert} disabled={isReverting}
            className="px-2.5 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)' }}>
            <RotateCcw className="w-3 h-3" />
            Revert
          </button>
        ) : (
          <button onClick={onApply} className="px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all btn-primary shrink-0">
            Apply
          </button>
        )
      )}
    </div>
  )
}

export function BestTweaksPage() {
  const { license, appliedTweaks, setAppliedTweaks, addAppliedTweak, addRollbackEntry } = useStore()
  const { addToast } = useToast()
  const [applying, setApplying] = useState<string | null>(null)
  const [reverting, setReverting] = useState<string | null>(null)
  const [expandedGroup, setExpandedGroup] = useState<string | null>('essential')
  const [infoTweak, setInfoTweak] = useState<Tweak | null>(null)
  const appliedSet = new Set(appliedTweaks)

  const tierCounts = useMemo(() => ({
    [LicenseTier.FREE]: availableTweaks.filter(t => t.requiredTier === LicenseTier.FREE).length,
    [LicenseTier.PRO]: availableTweaks.filter(t => t.requiredTier === LicenseTier.PRO).length,
    [LicenseTier.PREMIUM]: availableTweaks.filter(t => t.requiredTier === LicenseTier.PREMIUM).length,
  }), [])

  const handleApply = useCallback(async (tweakId: string) => {
    if (!window.electronAPI) return
    setApplying(tweakId)
    try {
      const result = await window.electronAPI.applyTweak(tweakId)
      const tweak = availableTweaks.find(t => t.id === tweakId)
      if (result.success) {
        addAppliedTweak(tweakId)
        addRollbackEntry(createRollbackEntry(tweakId))
        addToast(`${tweak?.name || tweakId} applied`, 'success')
      } else {
        addToast(`${tweak?.name || tweakId} failed`, 'error')
      }
    } catch (e: any) {
      addToast(`Error: ${e.message}`, 'error')
    }
    setApplying(null)
  }, [addToast, addAppliedTweak, addRollbackEntry])

  const handleApplyGroup = useCallback(async (group: TweakGroup) => {
    if (!window.electronAPI) return
    let successCount = 0
    let failCount = 0
    for (const tweakId of group.tweaks) {
      const tweak = availableTweaks.find(t => t.id === tweakId)
      if (!tweak || !canAccessTier(license.tier, tweak.requiredTier) || appliedSet.has(tweakId)) continue
      setApplying(tweakId)
      try {
        const result = await window.electronAPI.applyTweak(tweakId)
        if (result.success) {
          addAppliedTweak(tweakId)
          addRollbackEntry(createRollbackEntry(tweakId))
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }
    setApplying(null)
    addToast(`${group.label}: ${successCount} applied, ${failCount} failed`, successCount > 0 ? 'success' : 'error')
  }, [license.tier, appliedSet, addToast, addAppliedTweak, addRollbackEntry])

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
        <div className="flex items-center gap-4 fade-in">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
              <Sparkles className="w-6 h-6 text-black" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Best Tweaks</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Curated optimizations tested by our team</p>
          </div>
        </div>

        {/* Tier summary */}
        <div className="grid grid-cols-3 gap-3 stagger">
          {[
            { tier: LicenseTier.FREE, label: 'Free', count: tierCounts[LicenseTier.FREE], icon: Shield, desc: 'Essential tweaks' },
            { tier: LicenseTier.PRO, label: 'Pro', count: tierCounts[LicenseTier.PRO], icon: Zap, desc: 'Advanced tweaks' },
            { tier: LicenseTier.PREMIUM, label: 'Premium', count: tierCounts[LicenseTier.PREMIUM], icon: Sparkles, desc: 'Elite tweaks' },
          ].map(({ tier, label, count, icon: Icon, desc }) => {
            const isActive = tier === LicenseTier.FREE || license.tier === tier
            return (
              <div key={tier} className="card-widget p-5 flex items-center gap-4" style={{ opacity: isActive ? 1 : 0.4 }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-white">{label}</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{count} tweaks • {desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Tweak groups */}
        <div className="space-y-3">
          {GROUPS.map(group => {
            const Icon = group.icon
            const isExpanded = expandedGroup === group.id
            const groupTweaks = group.tweaks
              .map(id => availableTweaks.find(t => t.id === id))
              .filter(Boolean) as Tweak[]
            const appliedCount = groupTweaks.filter(t => appliedSet.has(t.id)).length
            const accessibleCount = groupTweaks.filter(t => canAccessTier(license.tier, t.requiredTier)).length
            const progress = groupTweaks.length > 0 ? (appliedCount / groupTweaks.length) * 100 : 0

            return (
              <div key={group.id} className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{ background: 'var(--bg-secondary)', border: `1px solid ${isExpanded ? 'var(--border-default)' : 'var(--border-subtle)'}` }}>
                {/* Group header */}
                <button onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-white">{group.label}</span>
                        <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                          {appliedCount}/{groupTweaks.length}
                        </span>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{group.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {isExpanded && (
                      <button onClick={(e) => { e.stopPropagation(); handleApplyGroup(group) }}
                        disabled={applying !== null}
                        className="h-9 px-5 rounded-xl text-[10px] font-bold flex items-center gap-2 btn-primary disabled:opacity-50">
                        {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Apply All
                      </button>
                    )}
                    {/* Mini progress */}
                    <div className="w-20 h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#fff' }} />
                    </div>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200" style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                  </div>
                </button>

                {/* Tweak list */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-1.5 stagger" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="py-2 px-4 flex items-center gap-3 text-[8px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                      <div className="w-5" />
                      <div className="flex-1">Tweak</div>
                      <div className="w-20 text-center">Impact</div>
                      <div className="w-[130px] text-right">Gaming Effect</div>
                      <div className="w-10" />
                      <div className="w-16" />
                    </div>
                    {groupTweaks.map(tweak => (
                      <TweakRow
                        key={tweak.id}
                        tweak={tweak}
                        isApplied={appliedSet.has(tweak.id)}
                        isApplying={applying === tweak.id}
                        isReverting={reverting === tweak.id}
                        hasAccess={canAccessTier(license.tier, tweak.requiredTier)}
                        onApply={() => handleApply(tweak.id)}
                        onRevert={() => handleRevert(tweak.id)}
                        onInfo={() => setInfoTweak(tweak)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <TweakInfoModal isOpen={!!infoTweak} onClose={() => setInfoTweak(null)} tweak={infoTweak} />
    </div>
  )
}
