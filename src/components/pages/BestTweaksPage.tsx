'use client'

import { useState, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { availableTweaks } from '@/data/tweaks'
import { canAccessTier } from '@/lib/featureAccess'
import { useToast } from '@/components/Toast'
import { Zap, Lock, CheckCircle2, Loader2, Shield, Cpu, Mouse, Keyboard, Wifi, HardDrive, Monitor, Volume2, Power, Sparkles, ArrowRight, RotateCcw } from 'lucide-react'
import { LicenseTier } from '@/types'
import type { Tweak } from '@/types'

interface TweakGroup {
  id: string
  label: string
  description: string
  icon: any
  color: string
  gradient: string
  tweaks: string[]
}

const GROUPS: TweakGroup[] = [
  {
    id: 'essential',
    label: 'Essential',
    description: 'Must-have optimizations for every gamer. Free and safe.',
    icon: Shield,
    color: '#ffffff',
    gradient: 'from-blue-500/10 to-blue-600/5',
    tweaks: [
      'sys-high-performance', 'sys-enable-game-mode', 'sys-disable-fullscreen-opt',
      'sys-visual-effects', 'mouse-disable-acceleration', 'mouse-raw-input',
      'kb-disable-filter-keys', 'kb-disable-sticky-keys', 'kb-disable-toggle-keys',
      'nv-max-power', 'nv-disable-vsync',
      'debloat-disable-startup', 'debloat-remove-background', 'debloat-superfetch',
      'net-disable-background-updates', 'net-optimize-dns',
      'cpu-core-parking-disable', 'cpu-smt-enable',
      'memory-wake-cleaner', 'memory-page-prefetch',
      'storage-ssd-optimization', 'storage-trim-optimization', 'storage-temp-file-cleaner',
      'audio-disable-enhancements', 'usb-selective-suspend-disable',
      'windows-explorer-optimization', 'windows-animation-optimization', 'windows-notification-optimization',
      'amd-max-power', 'intel-max-power',
    ],
  },
  {
    id: 'pro',
    label: 'Pro Boost',
    description: 'Advanced tweaks for competitive edge. Unlock with Pro key.',
    icon: Cpu,
    color: '#ffffff',
    gradient: 'from-violet-500/10 to-purple-600/5',
    tweaks: [
      'sys-cpu-priority',
      'nv-optimize-shader-cache', 'nv-low-latency', 'nv-texture-filtering',
      'net-reduce-congestion', 'net-disable-throttling',
      'debloat-disable-telemetry', 'debloat-disable-services',
      'mouse-optimize-pointer',
      'cpu-interrupt-affinity',
      'memory-virtual-memory', 'memory-pagefile-manager',
      'storage-nvme-optimization', 'storage-prefetch-manager', 'storage-write-cache',
      'windows-context-menu-cleanup', 'windows-scheduled-task-optimizer', 'windows-search-index-optimizer',
      'services-gaming-preset',
    ],
  },
  {
    id: 'premium',
    label: 'Premium Elite',
    description: 'Maximum performance with full system restore. Premium only.',
    icon: Sparkles,
    color: '#cccccc',
    gradient: 'from-amber-500/10 to-orange-600/5',
    tweaks: [
      'nv-hardware-scheduling',
      'net-reset-tcp',
      'memory-working-set',
      'services-streaming-preset', 'services-editing-preset', 'services-workstation-preset',
    ],
  },
]

function TweakRow({ tweak, isApplied, isApplying, isReverting, hasAccess, onApply, onRevert }: {
  tweak: Tweak; isApplied: boolean; isApplying: boolean; isReverting: boolean; hasAccess: boolean; onApply: () => void; onRevert: () => void
}) {
  const impactColor = tweak.impact === 'high' ? 'var(--success)' : tweak.impact === 'medium' ? 'var(--warning)' : 'var(--text-muted)'
  const riskColor = tweak.risk === 'medium' ? 'var(--danger)' : tweak.risk === 'low' ? 'var(--warning)' : 'var(--text-muted)'

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all group" style={{
      background: isApplied ? 'rgba(255,255,255,0.04)' : 'transparent',
      border: `1px solid ${isApplied ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
    }}>
      {/* Status */}
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
        {isApplied ? (
          <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
        ) : isApplying ? (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />
        ) : !hasAccess ? (
          <Lock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        ) : (
          <button onClick={onApply} className="w-5 h-5 rounded-full border transition-all hover:scale-110" style={{ borderColor: 'var(--border-strong)' }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold truncate" style={{ color: hasAccess ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {tweak.name}
          </span>
          {!hasAccess && (
            <span className="text-[7px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--warning)' }}>
              {tweak.requiredTier}
            </span>
          )}
        </div>
        <div className="text-[9px] truncate" style={{ color: 'var(--text-tertiary)' }}>{tweak.description}</div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[7px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded" style={{ background: `${impactColor}10`, color: impactColor }}>
          {tweak.impact}
        </span>
        {tweak.risk !== 'none' && (
          <span className="text-[7px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded" style={{ background: `${riskColor}10`, color: riskColor }}>
            {tweak.risk} risk
          </span>
        )}
      </div>

      {/* Gaming impact */}
      <div className="text-[9px] text-right max-w-[140px] truncate flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
        {tweak.gamingImpact}
      </div>

      {/* Action buttons */}
      {hasAccess && !isApplying && (
        isApplied ? (
          <button onClick={onRevert} disabled={isReverting}
            className="px-2.5 py-1 rounded-md text-[9px] font-bold flex items-center gap-1 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--warning)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <RotateCcw className="w-3 h-3" />
            Revert
          </button>
        ) : (
          <button onClick={onApply} className="px-2.5 py-1 rounded-md text-[9px] font-bold transition-all btn-primary">
            Apply
          </button>
        )
      )}
    </div>
  )
}

export function BestTweaksPage() {
  const { license, appliedTweaks, setAppliedTweaks, addAppliedTweak } = useStore()
  const { addToast } = useToast()
  const [applying, setApplying] = useState<string | null>(null)
  const [reverting, setReverting] = useState<string | null>(null)
  const [expandedGroup, setExpandedGroup] = useState<string | null>('essential')
  const appliedSet = new Set(appliedTweaks)

  const handleApply = useCallback(async (tweakId: string) => {
    if (!window.electronAPI) return
    setApplying(tweakId)
    try {
      const result = await window.electronAPI.applyTweak(tweakId)
      const tweak = availableTweaks.find(t => t.id === tweakId)
      if (result.success) {
        addAppliedTweak(tweakId)
        addToast(`${tweak?.name || tweakId} applied`, 'success')
      } else {
        addToast(`${tweak?.name || tweakId} failed`, 'error')
      }
    } catch (e: any) {
      addToast(`Error: ${e.message}`, 'error')
    }
    setApplying(null)
  }, [addToast, addAppliedTweak])

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
      <div>
        <h1 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Best Tweaks</h1>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Curated optimizations tested by our team and community</p>
      </div>

      {/* Tier summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { tier: 'FREE', label: 'Free', count: availableTweaks.filter(t => t.requiredTier === LicenseTier.FREE).length, color: 'var(--text-muted)', icon: Shield },
          { tier: 'PRO', label: 'Pro', count: availableTweaks.filter(t => t.requiredTier === LicenseTier.PRO).length, color: 'var(--accent)', icon: Zap },
          { tier: 'PREMIUM', label: 'Premium', count: availableTweaks.filter(t => t.requiredTier === LicenseTier.PREMIUM).length, color: '#cccccc', icon: Sparkles },
        ].map(({ tier, label, count, color, icon: Icon }) => {
          const isActive = license.tier === tier || (tier === 'FREE')
          return (
            <div key={tier} className="card-widget p-3.5 flex items-center gap-3 card-glow" style={{ opacity: isActive ? 1 : 0.5 }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}10`, border: `1px solid ${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color }}>{label}</div>
                <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{count} tweaks</div>
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

          return (
            <div key={group.id} className="card-widget overflow-hidden card-glow">
              {/* Group header */}
              <button
                onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all hover:bg-white/[0.01]"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${group.color}10`, border: `1px solid ${group.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: group.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{group.label}</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${group.color}10`, color: group.color }}>
                      {appliedCount}/{groupTweaks.length}
                    </span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{group.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  {isExpanded && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApplyGroup(group) }}
                      disabled={applying !== null}
                      className="h-8 px-4 rounded-lg text-[10px] font-bold flex items-center gap-1.5 btn-primary disabled:opacity-50"
                    >
                      {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                      Apply All
                    </button>
                  )}
                  <ArrowRight className="w-4 h-4 transition-transform" style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                </div>
              </button>

              {/* Tweak list */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-0.5 stagger" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="py-2 px-3 flex items-center gap-3 text-[8px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    <div className="w-5" />
                    <div className="flex-1">Tweak</div>
                    <div className="w-20 text-center">Impact</div>
                    <div className="w-[140px] text-right">Gaming Effect</div>
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
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
