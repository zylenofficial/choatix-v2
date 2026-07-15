'use client'

import { useState, useCallback, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { availableTweaks } from '@/data/tweaks'
import { canAccessTier } from '@/lib/featureAccess'
import { createRollbackEntry } from '@/lib/tweaks'
import { useToast } from '@/components/Toast'
import { Zap, Lock, CheckCircle2, Loader2, Shield, Cpu, Mouse, Wifi, HardDrive, Monitor, Volume2, Power, Sparkles, RotateCcw, Info, Search, Trash2, Gamepad2, Keyboard, Layers, Timer, AppWindow, Folder, ChevronDown, Check } from 'lucide-react'
import { LicenseTier } from '@/types'
import { TweakInfoModal } from '@/components/TweakInfoModal'
import type { Tweak, TweakCategory } from '@/types'

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  system: { label: 'System', icon: Shield, color: '#4ade80' },
  nvidia: { label: 'NVIDIA', icon: Monitor, color: '#60a5fa' },
  radeon: { label: 'AMD Radeon', icon: Monitor, color: '#f87171' },
  gpu: { label: 'GPU', icon: Monitor, color: '#60a5fa' },
  gaming: { label: 'Gaming', icon: Gamepad2, color: '#a78bfa' },
  directx: { label: 'DirectX', icon: Layers, color: '#fbbf24' },
  input: { label: 'Input', icon: Keyboard, color: '#fb923c' },
  latency: { label: 'Latency', icon: Timer, color: '#f87171' },
  alttab: { label: 'Alt-Tab', icon: AppWindow, color: '#60a5fa' },
  network: { label: 'Network', icon: Wifi, color: '#4ade80' },
  mouse: { label: 'Mouse', icon: Mouse, color: '#fbbf24' },
  keyboard: { label: 'Keyboard', icon: Keyboard, color: '#a78bfa' },
  storage: { label: 'Storage', icon: HardDrive, color: '#60a5fa' },
  windows: { label: 'Windows', icon: Gamepad2, color: '#4ade80' },
  audio: { label: 'Audio', icon: Volume2, color: '#a78bfa' },
  usb: { label: 'USB', icon: Power, color: '#fbbf24' },
  explorer: { label: 'Explorer', icon: Folder, color: '#60a5fa' },
  debloat: { label: 'Debloat', icon: Trash2, color: '#f87171' },
  privacy: { label: 'Privacy', icon: Shield, color: '#fb923c' },
}

const CATEGORY_ORDER: TweakCategory[] = [
  'system', 'nvidia', 'radeon', 'gpu', 'gaming', 'directx', 'input', 'latency', 'alttab', 'network', 'mouse', 'keyboard', 'storage', 'windows', 'audio', 'usb', 'explorer', 'debloat', 'privacy',
]

export function OptimizePage() {
  const { license, appliedTweaks, addAppliedTweak, addRollbackEntry } = useStore()
  const { addToast } = useToast()
  const [applying, setApplying] = useState<string | null>(null)
  const [reverting, setReverting] = useState<string | null>(null)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [infoTweak, setInfoTweak] = useState<Tweak | null>(null)
  const [search, setSearch] = useState('')

  const appliedSet = new Set(appliedTweaks)

  const tweaksByCategory = useMemo(() => CATEGORY_ORDER.map(cat => ({
    category: cat,
    meta: CATEGORY_META[cat] || { label: cat, icon: Shield, color: '#fff' },
    tweaks: availableTweaks.filter(t => t.category === cat),
  })).filter(g => g.tweaks.length > 0), [])

  const totalApplied = appliedTweaks.length
  const totalTweaks = availableTweaks.length
  const progressPct = totalTweaks > 0 ? (totalApplied / totalTweaks) * 100 : 0

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return tweaksByCategory
    const q = search.toLowerCase()
    return tweaksByCategory.map(group => ({
      ...group,
      tweaks: group.tweaks.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        group.meta.label.toLowerCase().includes(q)
      ),
    })).filter(g => g.tweaks.length > 0)
  }, [tweaksByCategory, search])

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

  const handleRevert = useCallback(async (tweakId: string) => {
    if (!window.electronAPI) return
    setReverting(tweakId)
    try {
      const result = await window.electronAPI.restoreTweak(tweakId)
      if (result.success) {
        const { setAppliedTweaks } = useStore.getState()
        setAppliedTweaks(appliedTweaks.filter(id => id !== tweakId))
        addToast('Reverted', 'success')
      } else {
        addToast('Failed to revert', 'error')
      }
    } catch (e: any) {
      addToast(`Error: ${e.message}`, 'error')
    }
    setReverting(null)
  }, [appliedTweaks, addToast])

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between reveal-up reveal-up-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center gradient-border" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              <Zap className="w-5 h-5" style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Optimize</h1>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{totalTweaks} tweaks available · {totalApplied} applied</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <input
              type="text"
              placeholder="Search tweaks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 pr-4 py-2 w-64 text-[12px]"
            />
          </div>
        </div>

        {/* Progress Section */}
        <div className="rounded-2xl p-5 frosted relative overflow-hidden reveal-up reveal-up-2" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none" style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
          }} />

          <div className="relative" style={{ zIndex: 1 }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Progress</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-light text-white">{totalApplied}</span>
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>/ {totalTweaks}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[32px] font-extralight text-white">{Math.round(progressPct)}%</div>
              </div>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="h-full rounded-full transition-all duration-1000 relative" style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.9))',
                boxShadow: '0 0 12px rgba(255,255,255,0.15)',
              }}>
                <div className="absolute inset-0 rounded-full" style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))',
                  animation: 'shimmer 2s ease-in-out infinite',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2.5">
          {filteredCategories.map(({ category, meta, tweaks }, idx) => {
            const Icon = meta.icon
            const appliedCount = tweaks.filter(t => appliedSet.has(t.id)).length
            const isOpen = expandedCat === category
            const progress = tweaks.length > 0 ? (appliedCount / tweaks.length) * 100 : 0

            return (
              <div key={category}
                className="rounded-2xl overflow-hidden transition-all duration-400 reveal-up"
                style={{
                  background: isOpen ? 'rgba(15,15,15,0.7)' : 'rgba(15,15,15,0.4)',
                  border: `1px solid ${isOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
                  boxShadow: isOpen ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
                  animationDelay: `${idx * 40}ms`,
                }}>
                <button onClick={() => setExpandedCat(isOpen ? null : category)}
                  className="w-full px-5 py-4 flex items-center justify-between transition-all duration-300 group"
                  style={{
                    background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent',
                  }}>
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105" style={{
                      background: `${meta.color}12`,
                      border: `1px solid ${meta.color}20`,
                      boxShadow: isOpen ? `0 0 16px ${meta.color}10` : 'none',
                    }}>
                      <Icon className="w-4.5 h-4.5" style={{ color: meta.color }} />
                    </div>
                    <div className="text-left">
                      <div className="text-[13px] font-bold text-white">{meta.label}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {appliedCount} of {tweaks.length} applied
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Mini progress ring */}
                    <div className="relative" style={{ width: 36, height: 36 }}>
                      <svg width={36} height={36} className="transform -rotate-90">
                        <circle stroke="rgba(255,255,255,0.05)" strokeWidth={2.5} fill="transparent" r={14} cx={18} cy={18} />
                        <circle
                          stroke={meta.color} strokeWidth={2.5} fill="transparent" r={14}
                          cx={18} cy={18}
                          strokeDasharray={14 * 2 * Math.PI}
                          strokeDashoffset={14 * 2 * Math.PI * (1 - progress / 100)}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[8px] font-bold" style={{ color: meta.color }}>
                          {appliedCount}
                        </span>
                      </div>
                    </div>

                    <ChevronDown className="w-4 h-4 transition-all duration-300" style={{
                      color: 'rgba(255,255,255,0.2)',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 grid grid-cols-3 gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {tweaks.map((tweak, tIdx) => {
                      const isApplied = appliedSet.has(tweak.id)
                      const isApplying = applying === tweak.id
                      const isReverting = reverting === tweak.id
                      const hasAccess = canAccessTier(license.tier, tweak.requiredTier)
                      const tierColor = tweak.requiredTier === LicenseTier.FREE ? '#4ade80' : tweak.requiredTier === LicenseTier.PRO ? '#60a5fa' : '#fbbf24'

                      return (
                        <div key={tweak.id}
                          className="rounded-xl p-4 transition-all duration-300 group relative overflow-hidden"
                          style={{
                            background: isApplied
                              ? 'rgba(74,222,128,0.04)'
                              : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isApplied ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)'}`,
                            opacity: hasAccess ? 1 : 0.4,
                          }}>

                          {/* Applied indicator glow */}
                          {isApplied && (
                            <div className="absolute -top-8 -right-8 w-16 h-16 rounded-full pointer-events-none" style={{
                              background: 'radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)',
                            }} />
                          )}

                          <div className="relative" style={{ zIndex: 1 }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide" style={{
                                background: `${meta.color}15`,
                                color: meta.color,
                                border: `1px solid ${meta.color}20`,
                              }}>
                                {meta.label}
                              </span>
                              {isApplied && (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
                                  background: 'rgba(74,222,128,0.15)',
                                  border: '1px solid rgba(74,222,128,0.2)',
                                }}>
                                  <Check className="w-2.5 h-2.5" style={{ color: '#4ade80' }} />
                                </div>
                              )}
                              {!hasAccess && <Lock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.15)' }} />}
                            </div>
                            <h3 className="text-[11px] font-bold text-white mb-1 truncate">{tweak.name}</h3>
                            <p className="text-[9px] leading-relaxed mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.25)' }}>{tweak.description}</p>
                            <div className="flex gap-2">
                              {hasAccess ? (
                                isApplied ? (
                                  <button onClick={() => handleRevert(tweak.id)} disabled={isReverting}
                                    className="flex-1 h-7 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-40 btn-press"
                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {isReverting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RotateCcw className="w-2.5 h-2.5" />}
                                    Revert
                                  </button>
                                ) : (
                                  <button onClick={() => handleApply(tweak.id)} disabled={isApplying}
                                    className="flex-1 h-7 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-40 btn-press ripple"
                                    style={{ background: '#fff', color: '#000', boxShadow: '0 2px 8px rgba(255,255,255,0.1)' }}>
                                    {isApplying ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                                    Apply
                                  </button>
                                )
                              ) : (
                                <span className="flex-1 h-7 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1"
                                  style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.2)' }}>
                                  <Lock className="w-2.5 h-2.5" /> {tweak.requiredTier}
                                </span>
                              )}
                              <button onClick={() => setInfoTweak(tweak)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <Info className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
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
