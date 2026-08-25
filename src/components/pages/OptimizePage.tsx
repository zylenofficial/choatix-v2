'use client'

import { useState, useCallback, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { availableTweaks } from '@/data/tweaks'
import { canAccessTier } from '@/lib/featureAccess'
import { createRollbackEntry } from '@/lib/tweaks'
import { useToast } from '@/components/Toast'
import { Zap, Lock, CheckCircle2, Loader2, Shield, Mouse, Wifi, HardDrive, Monitor, Volume2, Power, RotateCcw, Search, Trash2, Gamepad2, Keyboard, Layers, Timer, AppWindow, Folder, Check } from 'lucide-react'
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
  const { license, appliedTweaks, addAppliedTweak, addRollbackEntry, setAppliedTweaks } = useStore()
  const { addToast } = useToast()
  const [applying, setApplying] = useState<string | null>(null)
  const [reverting, setReverting] = useState<string | null>(null)
  const [activeCat, setActiveCat] = useState<string>('system')
  const [infoTweak, setInfoTweak] = useState<Tweak | null>(null)
  const [search, setSearch] = useState('')

  const approvedTweakIds = useMemo(() => new Set(availableTweaks.map(t => t.id)), [])
  const validAppliedTweaks = useMemo(
    () => [...new Set(appliedTweaks.filter(id => approvedTweakIds.has(id)))],
    [appliedTweaks, approvedTweakIds],
  )
  const appliedSet = new Set(validAppliedTweaks)

  const tweaksByCategory = useMemo(() => CATEGORY_ORDER.map(cat => ({
    category: cat,
    meta: CATEGORY_META[cat] || { label: cat, icon: Shield, color: '#fff' },
    tweaks: availableTweaks.filter(t => t.category === cat),
  })).filter(g => g.tweaks.length > 0), [])

  const totalApplied = validAppliedTweaks.length
  const totalTweaks = availableTweaks.length
  const progressPct = totalTweaks > 0 ? (totalApplied / totalTweaks) * 100 : 0

  const activeGroup = tweaksByCategory.find(g => g.category === activeCat)
  const activeTweaks = useMemo(() => {
    if (!activeGroup) return []
    if (!search.trim()) return activeGroup.tweaks
    const q = search.toLowerCase()
    return activeGroup.tweaks.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    )
  }, [activeGroup, search])

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
        const { setAppliedTweaks: setApplied } = useStore.getState()
        setApplied(validAppliedTweaks.filter(id => id !== tweakId))
        addToast('Reverted', 'success')
      } else {
        addToast('Failed to revert', 'error')
      }
    } catch (e: any) {
      addToast(`Error: ${e.message}`, 'error')
    }
    setReverting(null)
  }, [validAppliedTweaks, addToast, setAppliedTweaks])

  const handleApplyAll = useCallback(async () => {
    if (!activeGroup) return
    for (const tweak of activeGroup.tweaks) {
      if (!appliedSet.has(tweak.id) && canAccessTier(license.tier, tweak.requiredTier)) {
        await handleApply(tweak.id)
      }
    }
  }, [activeGroup, appliedSet, license.tier, handleApply])

  const handleRevertAll = useCallback(async () => {
    if (!activeGroup) return
    for (const tweak of activeGroup.tweaks) {
      if (appliedSet.has(tweak.id)) {
        await handleRevert(tweak.id)
      }
    }
  }, [activeGroup, appliedSet, handleRevert])

  return (
    <div className="h-full flex flex-col overflow-hidden page-transition">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Optimize</h1>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {totalApplied}/{totalTweaks} applied · {Math.round(progressPct)}%
            </p>
          </div>
          {/* Inline progress bar */}
          <div className="ml-3 w-32 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.8))',
            }} />
          </div>
        </div>
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-7 pr-3 py-1.5 w-44 text-[11px]"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="shrink-0 px-5 py-2 flex gap-1.5 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', scrollbarWidth: 'none' }}>
        {tweaksByCategory.map(({ category, meta, tweaks }) => {
          const Icon = meta.icon
          const appliedCount = tweaks.filter(t => appliedSet.has(t.id)).length
          const isActive = activeCat === category
          return (
            <button key={category}
              onClick={() => { setActiveCat(category); setSearch('') }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200"
              style={{
                background: isActive ? `${meta.color}18` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isActive ? `${meta.color}30` : 'rgba(255,255,255,0.04)'}`,
                color: isActive ? meta.color : 'rgba(255,255,255,0.4)',
              }}>
              <Icon className="w-3 h-3" />
              {meta.label}
              {appliedCount > 0 && (
                <span className="ml-0.5 px-1 py-0 rounded text-[8px] font-bold" style={{
                  background: `${meta.color}20`,
                  color: meta.color,
                }}>
                  {appliedCount}/{tweaks.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Action bar */}
      {activeGroup && (
        <div className="shrink-0 px-5 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <div className="flex items-center gap-2">
            <activeGroup.meta.icon className="w-3.5 h-3.5" style={{ color: activeGroup.meta.color }} />
            <span className="text-[11px] font-bold" style={{ color: activeGroup.meta.color }}>{activeGroup.meta.label}</span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {activeGroup.tweaks.filter(t => appliedSet.has(t.id)).length}/{activeGroup.tweaks.length}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleRevertAll}
              className="h-7 px-3 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              <RotateCcw className="w-3 h-3" /> Revert All
            </button>
            <button onClick={handleApplyAll}
              className="h-7 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: '#fff', color: '#000' }}>
              <Zap className="w-3 h-3" /> Apply All
            </button>
          </div>
        </div>
      )}

      {/* Tweak list */}
      <div className="flex-1 overflow-y-auto px-5 py-3" style={{ scrollbarWidth: 'thin' }}>
        {activeTweaks.length === 0 && (
          <div className="text-center py-12 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {search ? 'No tweaks match your search' : 'No tweaks in this category'}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {activeTweaks.map((tweak) => {
            const isApplied = appliedSet.has(tweak.id)
            const isApplying = applying === tweak.id
            const isReverting = reverting === tweak.id
            const hasAccess = canAccessTier(license.tier, tweak.requiredTier)
            const tierColor = tweak.requiredTier === LicenseTier.FREE ? '#4ade80' : tweak.requiredTier === LicenseTier.PRO ? '#60a5fa' : '#fbbf24'

            return (
              <div key={tweak.id}
                className="rounded-xl p-3 transition-all duration-200 group relative overflow-hidden"
                style={{
                  background: isApplied ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isApplied ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)'}`,
                  opacity: hasAccess ? 1 : 0.35,
                }}>
                {isApplied && (
                  <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full pointer-events-none" style={{
                    background: 'radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)',
                  }} />
                )}
                <div className="relative" style={{ zIndex: 1 }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-[11px] font-bold text-white leading-tight flex-1 min-w-0">{tweak.name}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {isApplied && (
                        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.15)' }}>
                          <Check className="w-2.5 h-2.5" style={{ color: '#4ade80' }} />
                        </div>
                      )}
                      {!hasAccess && <Lock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.15)' }} />}
                    </div>
                  </div>
                  <p className="text-[9px] leading-relaxed mb-2 line-clamp-2" style={{ color: 'rgba(255,255,255,0.25)' }}>{tweak.description}</p>
                  <div className="flex items-center gap-1.5">
                    {hasAccess ? (
                      isApplied ? (
                        <button onClick={() => handleRevert(tweak.id)} disabled={isReverting}
                          className="flex-1 h-6 rounded-lg text-[9px] font-semibold flex items-center justify-center gap-1 transition-all disabled:opacity-40"
                          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {isReverting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RotateCcw className="w-2.5 h-2.5" />}
                          Revert
                        </button>
                      ) : (
                        <button onClick={() => handleApply(tweak.id)} disabled={isApplying}
                          className="flex-1 h-6 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-40"
                          style={{ background: '#fff', color: '#000' }}>
                          {isApplying ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                          Apply
                        </button>
                      )
                    ) : (
                      <span className="flex-1 h-6 rounded-lg text-[9px] font-semibold flex items-center justify-center gap-1"
                        style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.15)' }}>
                        <Lock className="w-2.5 h-2.5" /> {tweak.requiredTier}
                      </span>
                    )}
                    <button onClick={() => setInfoTweak(tweak)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.15)' }}>i</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <TweakInfoModal isOpen={!!infoTweak} onClose={() => setInfoTweak(null)} tweak={infoTweak} />
    </div>
  )
}
