'use client'

import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { createRollbackEntry } from '@/lib/tweaks'
import { gameProfiles } from '@/data/games'
import type { GameProfile, LicenseTier } from '@/types'
import { LicenseTier as LT } from '@/types'
import {
  Gamepad2, Zap, CheckCircle, Lock, Settings2, Shield,
  Crown, Loader2, RotateCcw, ArrowRight, Sparkles,
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
  const [hoveredGame, setHoveredGame] = useState<string | null>(null)

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

  const handleOptimize = useCallback(async (game: GameProfile, tier: OptTier) => {
    setOptimizing(`${game.id}-${tier}`)
    try {
      const tweakList = getTweaksForTier(game, tier)
      await window.electronAPI?.applyGameTweaks(tweakList)
      for (const tweakId of tweakList) {
        addRollbackEntry(createRollbackEntry(tweakId))
      }
      setOptimized(prev => ({ ...prev, [game.id]: tier }))
    } catch (e) {}
    setOptimizing(null)
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
            const isWorking = optimizing?.startsWith(game.id)
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
                isWorking={!!isWorking}
                isHovered={hoveredGame === game.id}
                licenseTier={license.tier}
                onOptimize={handleOptimize}
                onRestore={handleRestore}
                onHover={(h) => setHoveredGame(h ? game.id : null)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function GameCard({ game, genre, isCompetitive, totalTweaks, optimized, isWorking, isHovered, licenseTier, onOptimize, onRestore, onHover }: {
  game: GameProfile; genre: string; isCompetitive: boolean; totalTweaks: number;
  optimized: OptTier | null; isWorking: boolean; isHovered: boolean; licenseTier: LicenseTier;
  onOptimize: (game: GameProfile, tier: OptTier) => void; onRestore: (game: GameProfile) => void;
  onHover: (hovered: boolean) => void
}) {
  const [imgError, setImgError] = useState(false)
  const imagePath = game.imagePath || `/Assets/Games/${game.id}.jpg`
  const showImage = !imgError && imagePath

  const tierMeta: Record<OptTier, { label: string; color: string; icon: any; tweaks: number }> = {
    free: { label: 'Free', color: '#4ade80', icon: Zap, tweaks: game.tweakTiers.free.length },
    pro: { label: 'Pro', color: '#60a5fa', icon: Shield, tweaks: game.tweakTiers.pro.length },
    premium: { label: 'Premium', color: '#fbbf24', icon: Crown, tweaks: game.tweakTiers.premium.length },
  }

  const optimizedColor = optimized === 'premium' ? '#fbbf24' : optimized === 'pro' ? '#60a5fa' : '#4ade80'

  return (
    <div
      className="group relative rounded-2xl overflow-hidden text-left transition-all duration-300"
      style={{
        background: '#0f0f0f',
        border: optimized ? `1px solid ${optimizedColor}30` : '1px solid rgba(255,255,255,0.06)',
        boxShadow: optimized ? `0 4px 24px ${optimizedColor}10` : 'none',
        zIndex: isHovered ? 50 : 1,
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Game image */}
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        {showImage ? (
          <img src={imagePath} alt={game.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)} draggable={false} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#1a1a1a' }}>
            <span className="text-lg font-bold text-white/10 tracking-widest uppercase">{game.name}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.8) 100%)',
        }} />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md backdrop-blur-sm"
            style={{
              background: isCompetitive ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.4)',
              color: isCompetitive ? '#fff' : 'rgba(255,255,255,0.6)',
              border: isCompetitive ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
            }}>
            {isCompetitive ? 'Competitive' : 'Casual'}
          </span>
          {optimized && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-sm"
              style={{ background: `${optimizedColor}20`, color: optimizedColor, border: `1px solid ${optimizedColor}30` }}>
              <CheckCircle className="w-3 h-3" />
              {optimized.toUpperCase()}
            </div>
          )}
        </div>

        {/* Bottom info */}
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
            const isWorkingThis = isWorking && !optimized

            return (
              <button
                key={tier}
                disabled={locked || meta.tweaks === 0 || isWorking}
                onClick={() => {
                  if (isActive) onRestore(game)
                  else if (!locked) onOptimize(game, tier)
                }}
                className="group/btn relative flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
                style={{
                  background: isActive ? `${meta.color}12` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? `${meta.color}30` : 'rgba(255,255,255,0.04)'}`,
                }}
              >
                {isWorkingThis ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: meta.color }} />
                ) : locked ? (
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
