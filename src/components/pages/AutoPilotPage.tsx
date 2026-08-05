'use client'

import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@/store/useStore'
import { createRollbackEntry } from '@/lib/tweaks'
import { gameProfiles } from '@/data/games'
import type { GameProfile, LicenseTier } from '@/types'
import { LicenseTier as LT } from '@/types'
import {
  Gamepad2, Zap, CheckCircle, Lock, Settings2, Shield,
  Crown, Loader2, RotateCcw, ArrowRight, Sparkles, X, Bolt,
} from 'lucide-react'

const GAME_GENRES: Record<string, string> = {
  'fortnite': 'Battle Royale', 'valorant': 'Tactical FPS', 'league-of-legends': 'MOBA',
  'cs2': 'Competitive FPS', 'apex-legends': 'Battle Royale', 'warzone': 'Battle Royale',
  'minecraft': 'Sandbox', 'fivem': 'Multiplayer', 'gta-v': 'Open World',
  'rainbow-six-siege': 'Tactical FPS', 'pubg': 'Battle Royale',
}

type OptTier = 'free' | 'pro' | 'premium'

const TIER_META: Record<OptTier, { label: string; color: string; icon: any; desc: string }> = {
  free: { label: 'Free', color: '#4ade80', icon: Zap, desc: 'Game Mode, DVR' },
  pro: { label: 'Pro', color: '#60a5fa', icon: Shield, desc: 'GPU, Input, Network' },
  premium: { label: 'Premium', color: '#fbbf24', icon: Crown, desc: 'Full optimization' },
}

const OPT_STEPS: Record<OptTier, string[]> = {
  free: ['Enabling Game Mode', 'Disabling DVR', 'Optimizing power plan', 'Clearing shader cache', 'Applying registry tweaks', 'Finalizing...'],
  pro: ['Enabling Game Mode', 'Disabling DVR', 'Optimizing power plan', 'Tuning GPU settings', 'Optimizing network stack', 'Disabling fullscreen optimizations', 'Configuring memory management', 'Applying registry tweaks', 'Finalizing...'],
  premium: ['Enabling Game Mode', 'Disabling DVR', 'Optimizing power plan', 'Tuning GPU settings', 'Optimizing network stack', 'Disabling fullscreen optimizations', 'Configuring memory management', 'Optimizing disk I/O', 'Tuning TCP/IP stack', 'Disabling telemetry', 'Disabling mouse acceleration', 'Optimizing CPU priority', 'Configuring interrupt affinity', 'Applying registry tweaks', 'Creating restore point', 'Finalizing...'],
}

function getTweaksForTier(game: GameProfile, tier: OptTier): string[] {
  switch (tier) {
    case 'free': return game.tweakTiers.free
    case 'pro': return [...game.tweakTiers.free, ...game.tweakTiers.pro]
    case 'premium': return [...game.tweakTiers.free, ...game.tweakTiers.pro, ...game.tweakTiers.premium]
  }
}

function tierLicenseRequired(optTier: OptTier): LicenseTier {
  switch (optTier) {
    case 'free': return LT.FREE
    case 'pro': return LT.PRO
    case 'premium': return LT.PREMIUM
  }
}

function tierRank(t: LicenseTier): number {
  switch (t) {
    case LT.FREE: return 1
    case LT.PRO: return 2
    case LT.PREMIUM: return 3
    default: return 0
  }
}

export function AutoPilotPage() {
  const { license, appliedTweaks, addRollbackEntry } = useStore()
  const [optimizing, setOptimizing] = useState<string | null>(null)
  const [optimized, setOptimized] = useState<Record<string, OptTier>>({})
  const [sheetGame, setSheetGame] = useState<GameProfile | null>(null)
  const [selectedTier, setSelectedTier] = useState<OptTier | null>(null)
  const [optProgress, setOptProgress] = useState<{ active: boolean; step: number; pct: number; label: string; success: number; failed: number }>({ active: false, step: 0, pct: 0, label: '', success: 0, failed: 0 })
  const [optComplete, setOptComplete] = useState(false)

  useEffect(() => {
    const state: Record<string, OptTier> = {}
    for (const game of gameProfiles) {
      for (const tier of ['premium', 'pro', 'free'] as OptTier[]) {
        const tweaks = getTweaksForTier(game, tier)
        if (tweaks.length > 0 && tweaks.every(id => appliedTweaks.includes(id))) {
          state[game.id] = tier
          break
        }
      }
    }
    setOptimized(state)
  }, [appliedTweaks])

  const openSheet = useCallback((game: GameProfile) => {
    setSheetGame(game)
    setSelectedTier(null)
    setOptProgress({ active: false, step: 0, pct: 0, label: '', success: 0, failed: 0 })
    setOptComplete(false)
  }, [])

  const closeSheet = useCallback(() => {
    setSheetGame(null)
    setSelectedTier(null)
    setOptProgress({ active: false, step: 0, pct: 0, label: '', success: 0, failed: 0 })
    setOptComplete(false)
  }, [])

  const startOptimization = useCallback(async (game: GameProfile, tier: OptTier) => {
    setSelectedTier(tier)
    const steps = OPT_STEPS[tier]
    setOptProgress({ active: true, step: 0, pct: 0, label: steps[0], success: 0, failed: 0 })

    try {
      const tweakList = getTweaksForTier(game, tier)
      const batchSize = Math.ceil(tweakList.length / steps.length)
      let allResults: { id: string; success: boolean; error?: string }[] = []
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < steps.length; i++) {
        const batch = tweakList.slice(i * batchSize, (i + 1) * batchSize)
        if (batch.length > 0) {
          const result = await window.electronAPI?.applyGameTweaks(batch)
          if (result?.results) {
            allResults = [...allResults, ...result.results]
            successCount += result.applied
            failCount += result.failed?.length || 0
          }
          for (const tweakId of batch) {
            addRollbackEntry(createRollbackEntry(tweakId))
          }
        }
        const pct = Math.round(((i + 1) / steps.length) * 100)
        setOptProgress({ active: true, step: i, pct, label: steps[i], success: successCount, failed: failCount })
        if (i < steps.length - 1) {
          await new Promise(r => setTimeout(r, 200))
        }
      }

      setOptimized(prev => ({ ...prev, [game.id]: tier }))
      setOptProgress(prev => ({ ...prev, pct: 100, label: 'Complete', success: successCount, failed: failCount }))
      await new Promise(r => setTimeout(r, 800))
      setOptProgress({ active: false, step: 0, pct: 100, label: '', success: successCount, failed: failCount })
      setOptComplete(true)
    } catch (e) {
      setOptProgress(prev => ({ ...prev, pct: 100, label: 'Error occurred', success: 0, failed: 1 }))
      await new Promise(r => setTimeout(r, 800))
      setOptProgress({ active: false, step: 0, pct: 0, label: '', success: 0, failed: 0 })
      setOptComplete(true)
    }
  }, [addRollbackEntry])

  const handleRestore = useCallback(async (game: GameProfile) => {
    setOptimizing(`${game.id}-restore`)
    try {
      const tweakList = [...game.tweakTiers.free, ...game.tweakTiers.pro, ...game.tweakTiers.premium]
      const result = await window.electronAPI?.restoreGameTweaks(tweakList)
      if (result?.success) {
        setOptimized(prev => { const n = { ...prev }; delete n[game.id]; return n })
      }
    } catch (e) {}
    setOptimizing(null)
  }, [])

  const handleRestoreAll = useCallback(async () => {
    setOptimizing('restore-all')
    try {
      for (const game of gameProfiles) {
        if (optimized[game.id]) {
          const tweakList = [...game.tweakTiers.free, ...game.tweakTiers.pro, ...game.tweakTiers.premium]
          await window.electronAPI?.restoreGameTweaks(tweakList)
        }
      }
      setOptimized({})
    } catch (e) {}
    setOptimizing(null)
  }, [optimized])

  const optimizedCount = Object.keys(optimized).length

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-6xl mx-auto px-6 py-5 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#fff', boxShadow: '0 2px 12px rgba(255,255,255,0.1)' }}>
              <Gamepad2 className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Game Optimizer</h1>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Hover a game and pick a tier to optimize</p>
            </div>
          </div>
          {optimizedCount > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={handleRestoreAll} disabled={optimizing === 'restore-all'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 hover:bg-white/5 disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                {optimizing === 'restore-all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Revert All
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}>
                <CheckCircle className="w-3.5 h-3.5" />
                {optimizedCount} optimized
              </div>
            </div>
          )}
        </div>

        {/* Tier legend */}
        <div className="flex gap-2 fade-in">
          {(['free', 'pro', 'premium'] as OptTier[]).map(tier => {
            const meta = TIER_META[tier]
            const Icon = meta.icon
            return (
              <div key={tier} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold" style={{ background: `${meta.color}08`, color: meta.color, border: `1px solid ${meta.color}15` }}>
                <Icon className="w-3.5 h-3.5" />
                <span>{meta.label}</span>
                <span className="opacity-40">|</span>
                <span className="opacity-60">{meta.desc}</span>
              </div>
            )
          })}
        </div>

        {/* Game grid */}
        <div className="grid grid-cols-3 gap-4 stagger" style={{ position: 'relative', zIndex: 0 }}>
          {gameProfiles.map(game => {
            const gameOptimized = optimized[game.id] || null
            const genre = GAME_GENRES[game.id] || 'Game'
            const isCompetitive = game.priority === 1
            const totalTweaks = game.tweakTiers.free.length + game.tweakTiers.pro.length + game.tweakTiers.premium.length

            return (
              <GameCard
                key={game.id}
                game={game}
                genre={genre}
                isCompetitive={isCompetitive}
                totalTweaks={totalTweaks}
                optimized={gameOptimized}
                licenseTier={license.tier}
                onOpenSheet={openSheet}
                onRestore={handleRestore}
              />
            )
          })}
        </div>
      </div>

      {typeof window !== 'undefined' && createPortal(<>
      {/* Bottom Sheet Overlay */}
      <div
        className="fixed inset-0 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
          opacity: sheetGame ? 1 : 0,
          pointerEvents: sheetGame ? 'all' : 'none',
        }}
        onClick={closeSheet}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 transition-transform duration-300"
        style={{
          zIndex: 201,
          background: '#0f0f0f',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '20px 20px 0 0',
          transform: sheetGame ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '55vh',
          boxShadow: '0 -24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#333', margin: '12px auto 0' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <h3 className="text-[14px] font-bold text-white flex items-center gap-2">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px rgba(255,255,255,0.3)' }} />
            Optimize Game
          </h3>
          <button onClick={closeSheet} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ background: '#1a1a1a', color: 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#222'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Game Info */}
        {sheetGame && (
          <div className="flex items-center gap-3 px-5 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#1a1a1a' }}>
              <img src={sheetGame.imagePath || `/Assets/Games/${sheetGame.id}.jpg`} alt={sheetGame.name}
                className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">{sheetGame.name}</div>
              <div className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>{GAME_GENRES[sheetGame.id] || 'Game'}</div>
            </div>
          </div>
        )}

        {/* Plan Selection */}
        {!optProgress.active && !optComplete && sheetGame && (
          <div className="grid grid-cols-3 gap-2 p-4">
            {(['free', 'pro', 'premium'] as OptTier[]).map(tier => {
              const meta = TIER_META[tier]
              const Icon = meta.icon
              const requiredTier = tierLicenseRequired(tier)
              const locked = tierRank(license.tier) < tierRank(requiredTier)
              const tweakCount = getTweaksForTier(sheetGame!, tier).length
              const isSelected = selectedTier === tier

              return (
                <button
                  key={tier}
                  disabled={locked || tweakCount === 0}
                  onClick={() => startOptimization(sheetGame!, tier)}
                  className="relative flex flex-col items-center text-center py-3 rounded-xl transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.03)' : '#080808',
                    border: `1px solid ${isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    cursor: locked ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => { if (!locked) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3)' } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center mb-1.5" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Icon className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <div className="text-[8px] font-bold tracking-widest uppercase mb-1" style={{ color: tier === 'pro' ? '#fff' : 'rgba(255,255,255,0.3)' }}>{meta.label}</div>
                  <div className="text-[18px] font-extrabold text-white leading-none mb-0.5">{tweakCount}</div>
                  <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>tweaks</div>
                  {tier === 'pro' && (
                    <div className="absolute -top-2 right-[-4px] text-[6px] font-extrabold tracking-wider px-1.5 py-0.5 rounded" style={{ background: '#fff', color: '#000', boxShadow: '0 0 6px rgba(255,255,255,0.2)' }}>BEST</div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Optimization Progress */}
        {optProgress.active && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Optimizing...</span>
              <div className="flex items-center gap-3">
                {optProgress.success > 0 && (
                  <span className="text-[10px] font-bold" style={{ color: '#4ade80' }}>{optProgress.success} applied</span>
                )}
                {optProgress.failed > 0 && (
                  <span className="text-[10px] font-bold" style={{ color: '#f87171' }}>{optProgress.failed} failed</span>
                )}
                <span className="text-[11px] font-bold text-white">{optProgress.pct}%</span>
              </div>
            </div>
            <div className="h-[3px] rounded-sm overflow-hidden mb-2" style={{ background: '#222' }}>
              <div className="h-full rounded-sm transition-all duration-300" style={{
                width: `${optProgress.pct}%`,
                background: optProgress.failed > 0 && optProgress.success === 0 ? '#f87171' : '#fff',
                boxShadow: '0 0 8px rgba(255,255,255,0.1)',
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 30, height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 mt-3">
              {OPT_STEPS[selectedTier!].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]" style={{
                  color: i < optProgress.step ? 'rgba(255,255,255,0.5)' : i === optProgress.step ? '#fff' : 'rgba(255,255,255,0.2)',
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                    background: i < optProgress.step ? '#fff' : i === optProgress.step ? '#fff' : '#333',
                    boxShadow: i <= optProgress.step ? '0 0 4px rgba(255,255,255,0.3)' : 'none',
                    animation: i === optProgress.step ? 'pulse 1s infinite' : 'none',
                  }} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optimization Complete */}
        {optComplete && (
          <div className="text-center px-6 pb-7 pt-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: optProgress.failed > 0 && optProgress.success === 0 ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.06)', border: `1px solid ${optProgress.failed > 0 && optProgress.success === 0 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.15)'}`, boxShadow: `0 0 12px ${optProgress.failed > 0 && optProgress.success === 0 ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.08)'}`, animation: 'checkPop 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
              <CheckCircle className="w-5 h-5" style={{ color: optProgress.failed > 0 && optProgress.success === 0 ? '#f87171' : '#fff' }} />
            </div>
            <h4 className="text-[13px] font-bold text-white mb-1">{sheetGame?.name} Optimized</h4>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {selectedTier!.charAt(0).toUpperCase() + selectedTier!.slice(1)} · {optProgress.success} tweaks applied
              {optProgress.failed > 0 && <span style={{ color: '#f87171' }}> · {optProgress.failed} failed</span>}
            </p>
          </div>
        )}
      </div>
      </>, document.body)}

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes checkPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.4,0,0.2,1) forwards; opacity: 0; }
        .stagger > * { opacity: 0; animation: fadeIn 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
        .stagger > *:nth-child(1) { animation-delay: 0ms; }
        .stagger > *:nth-child(2) { animation-delay: 35ms; }
        .stagger > *:nth-child(3) { animation-delay: 70ms; }
        .stagger > *:nth-child(4) { animation-delay: 105ms; }
        .stagger > *:nth-child(5) { animation-delay: 140ms; }
        .stagger > *:nth-child(6) { animation-delay: 175ms; }
        .stagger > *:nth-child(7) { animation-delay: 210ms; }
        .stagger > *:nth-child(8) { animation-delay: 245ms; }
        .stagger > *:nth-child(9) { animation-delay: 280ms; }
        .stagger > *:nth-child(10) { animation-delay: 315ms; }
        .stagger > *:nth-child(11) { animation-delay: 350ms; }
        .stagger > *:nth-child(12) { animation-delay: 385ms; }
      `}</style>
    </div>
  )
}

function GameCard({ game, genre, isCompetitive, totalTweaks, optimized, licenseTier, onOpenSheet, onRestore }: {
  game: GameProfile; genre: string; isCompetitive: boolean; totalTweaks: number;
  optimized: OptTier | null; licenseTier: LicenseTier;
  onOpenSheet: (game: GameProfile) => void; onRestore: (game: GameProfile) => void
}) {
  const [imgError, setImgError] = useState(false)
  const imagePath = game.imagePath || `/Assets/Games/${game.id}.jpg`
  const showImage = !imgError && imagePath

  const optimizedColor = optimized === 'premium' ? '#fbbf24' : optimized === 'pro' ? '#60a5fa' : '#4ade80'

  const tierMeta: Record<OptTier, { label: string; color: string; icon: any; tweaks: number }> = {
    free: { label: 'Free', color: '#4ade80', icon: Zap, tweaks: game.tweakTiers.free.length },
    pro: { label: 'Pro', color: '#60a5fa', icon: Shield, tweaks: game.tweakTiers.pro.length },
    premium: { label: 'Premium', color: '#fbbf24', icon: Crown, tweaks: game.tweakTiers.premium.length },
  }

  return (
    <div
      className="group relative rounded-2xl overflow-hidden text-left transition-all duration-300"
      style={{
        background: '#0f0f0f',
        border: optimized ? `1px solid ${optimizedColor}30` : '1px solid rgba(255,255,255,0.06)',
        boxShadow: optimized ? `0 4px 24px ${optimizedColor}10` : 'none',
      }}
    >
      {/* Game image */}
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        {showImage ? (
          <img src={imagePath} alt={game.name}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            style={{ filter: 'grayscale(0.15) opacity(0.85)' }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'grayscale(0) opacity(1)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'grayscale(0.15) opacity(0.85)' }}
            onError={() => setImgError(true)} draggable={false} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white/10 tracking-widest uppercase">{game.name}</span>
          </div>
        )}

        {/* Top badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[6px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
            style={{
              background: isCompetitive ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.4)',
              color: isCompetitive ? '#fff' : 'rgba(255,255,255,0.6)',
              border: isCompetitive ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
            }}>
            {isCompetitive ? 'Competitive' : 'Casual'}
          </span>
        </div>

        {/* Optimized badge */}
        {optimized && (
          <div className="absolute top-2 right-2 z-10 w-5.5 h-5.5 rounded-full flex items-center justify-center" style={{
            width: 22, height: 22,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 0 8px rgba(255,255,255,0.06)',
            animation: 'checkPop 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <CheckCircle className="w-3 h-3" style={{ color: '#fff', fill: 'none' }} />
          </div>
        )}

        {/* Circular Optimize Button (Roblox lightning style) */}
        <button
          className="absolute z-20 flex items-center justify-center transition-all duration-200"
          style={{
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 44, height: 44,
            borderRadius: '50%',
            background: '#000',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 0 16px rgba(255,255,255,0.04), 0 0 24px rgba(255,255,255,0.02)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.08), 0 0 40px rgba(255,255,255,0.05)'
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.05)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
            e.currentTarget.style.boxShadow = '0 0 16px rgba(255,255,255,0.04), 0 0 24px rgba(255,255,255,0.02)'
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
          }}
          onMouseDown={e => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(0.92)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.05)' }}
          onClick={(e) => { e.stopPropagation(); onOpenSheet(game) }}
          title={`Optimize ${game.name}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.4))' }}>
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>

        {/* Game info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <div className="text-[15px] font-bold text-white leading-tight mb-0.5 drop-shadow-lg">{game.name}</div>
          <div className="text-[11px] drop-shadow-md" style={{ color: 'rgba(255,255,255,0.5)' }}>{genre}</div>
        </div>
      </div>

      {/* Tier buttons — always visible */}
      <div className="p-2.5" style={{ background: '#0a0a0a' }}>
        <div className="grid grid-cols-3 gap-1.5">
          {(['free', 'pro', 'premium'] as OptTier[]).map(tier => {
            const meta = tierMeta[tier]
            const Icon = meta.icon
            const requiredTier = tierLicenseRequired(tier)
            const locked = tierRank(licenseTier) < tierRank(requiredTier)
            const isActive = optimized === tier

            return (
              <button
                key={tier}
                disabled={locked || meta.tweaks === 0}
                onClick={() => {
                  if (isActive) onRestore(game)
                  else if (!locked) onOpenSheet(game)
                }}
                className="group/btn relative flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
                style={{
                  background: isActive ? `${meta.color}12` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? `${meta.color}30` : 'rgba(255,255,255,0.04)'}`,
                }}
              >
                {locked ? (
                  <Lock className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.15)' }} />
                ) : (
                  <Icon className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" style={{ color: isActive ? meta.color : 'rgba(255,255,255,0.3)' }} />
                )}
                <div className="text-center">
                  <div className="text-[10px] font-bold" style={{ color: isActive ? meta.color : 'rgba(255,255,255,0.7)' }}>{meta.label}</div>
                  <div className="text-[9px]" style={{ color: isActive ? `${meta.color}80` : 'rgba(255,255,255,0.2)' }}>{meta.tweaks}</div>
                </div>
                {isActive && (
                  <div className="absolute -top-px -right-px w-4 h-4 rounded-full flex items-center justify-center" style={{ background: meta.color }}>
                    <CheckCircle className="w-2.5 h-2.5 text-black" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
