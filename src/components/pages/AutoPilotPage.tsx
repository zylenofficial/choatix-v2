'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { canAccess } from '@/lib/featureAccess'
import { gameProfiles } from '@/data/games'
import type { GameProfile, LicenseTier } from '@/types'
import { LicenseTier as LT } from '@/types'
import {
  Gamepad2, Zap, CheckCircle, Lock, Monitor, Settings2, Shield,
  Loader2, RefreshCw, Crown, Star, Play, Square, Search, ArrowRight,
  Cpu, Activity, Wifi, HardDrive,
} from 'lucide-react'

type Tab = 'games' | 'optimize'

const GAME_GENRES: Record<string, string> = {
  'fortnite': 'Battle Royale', 'valorant': 'Tactical FPS', 'league-of-legends': 'MOBA',
  'cs2': 'Competitive FPS', 'apex-legends': 'Battle Royale', 'warzone': 'Battle Royale',
  'minecraft': 'Sandbox', 'fivem': 'Multiplayer', 'gta-v': 'Open World',
  'rainbow-six-siege': 'Tactical FPS', 'pubg': 'Battle Royale',
}

interface DetectedGame {
  profile: GameProfile
  pid: number
  optimizedTier: LicenseTier | null
}

type OptTier = 'free' | 'pro' | 'premium'

const TIER_META: Record<OptTier, { label: string; icon: any; desc: string; tweaks: string; color: string }> = {
  free: { label: 'Free', icon: Zap, desc: 'Game Mode, DVR, animations', tweaks: '6 tweaks', color: '#fff' },
  pro: { label: 'Pro', icon: Star, desc: 'VBS, GPU scheduling, input, network', tweaks: '~15 tweaks', color: '#fff' },
  premium: { label: 'Premium', icon: Crown, desc: 'Mitigations, realtime, GPU power', tweaks: '~20 tweaks', color: '#fff' },
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
  const { license, selectedGames, setSelectedGames, appliedTweaks } = useStore()
  const [tab, setTab] = useState<Tab>('games')
  const hasMulti = canAccess('autopilot_multi', license.tier)

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
                <Gamepad2 className="w-6 h-6 text-black" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Game Optimizer</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Detect running games and optimize with one click</p>
            </div>
          </div>
          {selectedGames.length > 0 && (
            <button onClick={() => setTab('optimize')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover-lift"
              style={{ background: '#fff', color: '#000', boxShadow: '0 4px 20px rgba(255,255,255,0.15)' }}>
              <Play className="w-3.5 h-3.5" />
              Detect & Optimize
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl fade-in" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          {([['games', 'Game Library', Gamepad2], ['optimize', 'Detect & Optimize', Monitor]] as [Tab, string, any][]).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all duration-300"
              style={{
                background: tab === id ? '#fff' : 'transparent',
                color: tab === id ? '#000' : 'var(--text-secondary)',
                boxShadow: tab === id ? '0 2px 12px rgba(255,255,255,0.2)' : 'none',
              }}>
              <Icon className="w-4 h-4" />
              {label}
              {id === 'optimize' && selectedGames.length > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center"
                  style={{ background: tab === 'optimize' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)', color: tab === 'optimize' ? '#000' : '#fff' }}>
                  {selectedGames.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'games' && <GamesTab hasMulti={hasMulti} selectedGames={selectedGames} setSelectedGames={setSelectedGames} />}
        {tab === 'optimize' && <OptimizeTab selectedGames={selectedGames} appliedTweaks={appliedTweaks} licenseTier={license.tier} />}
      </div>
    </div>
  )
}

function GamesTab({ hasMulti, selectedGames, setSelectedGames }: { hasMulti: boolean; selectedGames: GameProfile[]; setSelectedGames: (g: GameProfile[]) => void }) {
  const toggle = useCallback((game: GameProfile) => {
    const exists = selectedGames.find(g => g.id === game.id)
    if (exists) {
      setSelectedGames(selectedGames.filter(g => g.id !== game.id))
    } else {
      if (!hasMulti && selectedGames.length >= 1) return
      setSelectedGames([...selectedGames, game])
    }
  }, [selectedGames, setSelectedGames, hasMulti])

  const selectedIds = new Set(selectedGames.map(g => g.id))

  return (
    <div className="space-y-5 fade-in">
      {!hasMulti && (
        <div className="p-4 rounded-2xl flex items-center gap-4 fade-in" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-dim)' }}>
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-white">Free plan: 1 game only</div>
            <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Upgrade to <span className="text-white font-bold">PRO</span> to add unlimited games</div>
          </div>
        </div>
      )}

      {selectedGames.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
            <div className="w-2 h-2 rounded-full" style={{ background: '#fff' }} />
            {selectedGames.length} game{selectedGames.length > 1 ? 's' : ''} selected
          </div>
          <button onClick={() => setSelectedGames([])} className="text-[10px] font-bold text-[var(--text-muted)] hover:text-white transition-colors">
            Clear All
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 stagger">
        {gameProfiles.map(game => {
          const selected = selectedIds.has(game.id)
          const locked = !hasMulti && !selected && selectedGames.length >= 1
          const genre = GAME_GENRES[game.id] || 'Game'
          const isCompetitive = game.priority === 1

          return (
            <GameCard
              key={game.id}
              game={game}
              genre={genre}
              selected={selected}
              locked={locked}
              isCompetitive={isCompetitive}
              onClick={() => !locked && toggle(game)}
            />
          )
        })}
      </div>
    </div>
  )
}

function GameCard({ game, genre, selected, locked, isCompetitive, onClick }: {
  game: GameProfile; genre: string; selected: boolean; locked: boolean; isCompetitive: boolean; onClick: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const imagePath = game.imagePath || `/Assets/Games/${game.id}.jpg`
  const showImage = !imgError && imagePath
  const totalTweaks = game.tweakTiers.free.length + game.tweakTiers.pro.length + game.tweakTiers.premium.length

  return (
    <button onClick={onClick}
      className="game-card group relative rounded-2xl overflow-hidden text-left transition-all duration-200"
      style={{
        aspectRatio: '16/10',
        border: selected ? '2px solid #fff' : '2px solid transparent',
        boxShadow: selected ? '0 0 20px rgba(255,255,255,0.15)' : 'none',
        opacity: locked ? 0.35 : 1,
        cursor: locked ? 'not-allowed' : 'pointer',
        background: '#111',
      }}>
      {showImage ? (
        <img src={imagePath} alt={game.name}
          className="game-card-image absolute inset-0 w-full h-full object-cover"
          onError={() => setImgError(true)} draggable={false} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#1a1a1a' }}>
          <span className="text-lg font-bold text-white/20 tracking-widest uppercase">{game.name}</span>
        </div>
      )}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%)',
      }} />
      <div className="absolute top-3 right-3 z-10">
        {selected ? (
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#fff' }}>
            <CheckCircle className="w-3.5 h-3.5 text-black" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border transition-all duration-200 group-hover:border-white/40" style={{ borderColor: 'rgba(255,255,255,0.25)' }} />
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <div className="text-[13px] font-bold text-white leading-tight mb-0.5">{game.name}</div>
        <div className="text-[10px] text-white/50 mb-1.5">{genre}</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Settings2 className="w-2.5 h-2.5 text-white/40" />
            <span className="text-[9px] text-white/50">{totalTweaks}</span>
          </div>
          <span className="text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
            style={{
              background: isCompetitive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
              color: isCompetitive ? '#fff' : 'rgba(255,255,255,0.45)',
            }}>
            {isCompetitive ? 'Competitive' : 'Casual'}
          </span>
        </div>
      </div>
      {locked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <Lock className="w-5 h-5 text-white/30" />
        </div>
      )}
    </button>
  )
}

function OptimizeTab({ selectedGames, appliedTweaks, licenseTier }: { selectedGames: GameProfile[]; appliedTweaks: string[]; licenseTier: LicenseTier }) {
  const [detected, setDetected] = useState<DetectedGame[]>([])
  const [scanning, setScanning] = useState(false)
  const [optimizing, setOptimizing] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [selectedTier, setSelectedTier] = useState<OptTier>('pro')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const scanForGames = useCallback(async () => {
    if (selectedGames.length === 0) return
    setScanning(true)
    try {
      const executables = selectedGames.map(g => g.executable)
      const result = await window.electronAPI?.detectGames(executables)
      if (result?.running) {
        const detectedGames: DetectedGame[] = []
        for (const proc of result.running) {
          const profile = selectedGames.find(g =>
            g.executable.replace(/\.(exe)$/i, '').toLowerCase() === proc.name.toLowerCase()
          )
          if (profile) {
            let optimizedTier: LicenseTier | null = null
            const tiers: OptTier[] = ['premium', 'pro', 'free']
            for (const t of tiers) {
              const tweakList = getTweaksForTier(profile, t)
              if (tweakList.every(id => appliedTweaks.includes(id))) {
                optimizedTier = tierLicenseRequired(t)
                break
              }
            }
            detectedGames.push({ profile, pid: proc.pid, optimizedTier })
          }
        }
        setDetected(detectedGames)
      } else {
        setDetected([])
      }
    } catch (e) {
      console.error('Game detection error:', e)
    }
    setScanning(false)
  }, [selectedGames, appliedTweaks])

  useEffect(() => {
    scanForGames()
    intervalRef.current = setInterval(scanForGames, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [scanForGames])

  const handleOptimize = useCallback(async (game: DetectedGame, tier: OptTier) => {
    setOptimizing(`${game.profile.id}-${tier}`)
    try {
      const tweakList = getTweaksForTier(game.profile, tier)
      await window.electronAPI?.applyGameTweaks(tweakList)
      await scanForGames()
    } catch (e) {
      console.error('Optimize error:', e)
    }
    setOptimizing(null)
  }, [scanForGames])

  const handleRestore = useCallback(async (game: DetectedGame) => {
    setRestoring(game.profile.id)
    try {
      const tweakList = [...game.profile.tweakTiers.free, ...game.profile.tweakTiers.pro, ...game.profile.tweakTiers.premium]
      await window.electronAPI?.restoreGameTweaks(tweakList)
      await scanForGames()
    } catch (e) {
      console.error('Restore error:', e)
    }
    setRestoring(null)
  }, [scanForGames])

  return (
    <div className="space-y-5 fade-in">

      {/* Tier selector — horizontal pills */}
      <div className="flex gap-2">
        {(['free', 'pro', 'premium'] as OptTier[]).map(tier => {
          const meta = TIER_META[tier]
          const Icon = meta.icon
          const requiredTier = tierLicenseRequired(tier)
          const locked = tierRank(licenseTier) < tierRank(requiredTier)
          const active = selectedTier === tier
          return (
            <button key={tier} onClick={() => !locked && setSelectedTier(tier)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all duration-200"
              style={{
                background: active ? '#fff' : 'rgba(255,255,255,0.04)',
                color: active ? '#000' : locked ? 'rgba(255,255,255,0.2)' : '#fff',
                border: active ? '2px solid #fff' : '2px solid rgba(255,255,255,0.06)',
                opacity: locked ? 0.35 : 1,
                cursor: locked ? 'not-allowed' : 'pointer',
                boxShadow: active ? '0 2px 16px rgba(255,255,255,0.15)' : 'none',
              }}>
              {locked ? <Lock className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              <span>{meta.label}</span>
              <span className="text-[8px] font-normal opacity-60">{meta.tweaks}</span>
            </button>
          )
        })}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: scanning ? '#fff' : detected.length > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)', borderColor: 'var(--bg-secondary)' }} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              {scanning ? 'Scanning...' : detected.length > 0 ? `${detected.length} game${detected.length !== 1 ? 's' : ''} running` : 'Waiting for games'}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              {selectedGames.length > 0 ? `Monitoring ${selectedGames.map(g => g.name).join(', ')}` : 'Select games in Game Library first'}
            </div>
          </div>
        </div>
        <button onClick={scanForGames} disabled={selectedGames.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
          <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
          Scan
        </button>
      </div>

      {/* No games selected */}
      {selectedGames.length === 0 && (
        <div className="rounded-3xl p-16 flex flex-col items-center gap-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.1)' }}>
            <Gamepad2 className="w-7 h-7 text-[var(--text-muted)]" />
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-white mb-1">No games selected</div>
            <div className="text-xs text-[var(--text-muted)]">Switch to Game Library and select games to optimize</div>
          </div>
        </div>
      )}

      {/* No games running */}
      {selectedGames.length > 0 && detected.length === 0 && !scanning && (
        <div className="rounded-3xl p-16 flex flex-col items-center gap-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.1)' }}>
              <Monitor className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-secondary)', border: '2px solid rgba(255,255,255,0.1)' }}>
              <Activity className="w-2.5 h-2.5 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-white mb-1">No games running</div>
            <div className="text-xs text-[var(--text-muted)]">Launch a selected game and it will appear here</div>
          </div>
        </div>
      )}

      {/* Detected games — cards */}
      {detected.length > 0 && (
        <div className="space-y-3">
          {detected.map(game => {
            const isOptimized = game.optimizedTier !== null
            const isWorking = optimizing !== null && optimizing.startsWith(game.profile.id)
            return (
              <div key={game.profile.id}
                className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: isOptimized ? 'rgba(255,255,255,0.04)' : 'var(--bg-secondary)',
                  border: isOptimized ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--border-subtle)',
                }}>

                {/* Game header row */}
                <div className="flex items-center gap-4 p-5">
                  {/* Game icon with pulse */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: isOptimized ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)' }}>
                      <Gamepad2 className="w-7 h-7" style={{ color: isOptimized ? '#fff' : 'rgba(255,255,255,0.5)' }} />
                    </div>
                    {!isOptimized && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#fff' }}>
                        <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                      </div>
                    )}
                    {isOptimized && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#fff' }}>
                        <CheckCircle className="w-2.5 h-2.5 text-black" />
                      </div>
                    )}
                  </div>

                  {/* Game info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{game.profile.name}</span>
                      {isOptimized && (
                        <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                          {game.optimizedTier === LT.PREMIUM ? 'Premium' : game.optimizedTier === LT.PRO ? 'Pro' : 'Free'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-[var(--text-muted)]">PID {game.pid}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">|</span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {getTweaksForTier(game.profile, 'premium').length} total tweaks
                      </span>
                    </div>
                  </div>

                  {/* Restore button (only when optimized) */}
                  {isOptimized && (
                    <button onClick={() => handleRestore(game)} disabled={restoring === game.profile.id}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all duration-200 hover:bg-white/10"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {restoring === game.profile.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
                      Restore
                    </button>
                  )}
                </div>

                {/* Tier buttons — only when not optimized */}
                {!isOptimized && (
                  <div className="px-5 pb-5">
                    <div className="grid grid-cols-3 gap-2.5">
                      {(['free', 'pro', 'premium'] as OptTier[]).map(tier => {
                        const meta = TIER_META[tier]
                        const Icon = meta.icon
                        const requiredTier = tierLicenseRequired(tier)
                        const locked = tierRank(licenseTier) < tierRank(requiredTier)
                        const tweakCount = getTweaksForTier(game.profile, tier).length
                        const isWorking = optimizing === `${game.profile.id}-${tier}`
                        return (
                          <button key={tier} onClick={() => !locked && handleOptimize(game, tier)}
                            disabled={locked || (optimizing !== null && !isWorking)}
                            className="group relative flex flex-col items-center gap-2 py-4 rounded-xl transition-all duration-200 disabled:opacity-30"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                            {isWorking ? (
                              <Loader2 className="w-5 h-5 animate-spin text-white" />
                            ) : locked ? (
                              <Lock className="w-5 h-5 text-white/20" />
                            ) : (
                              <Icon className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                            )}
                            <div className="text-center">
                              <div className="text-[11px] font-bold text-white">{meta.label}</div>
                              <div className="text-[9px] text-white/30 mt-0.5">{tweakCount} tweaks</div>
                            </div>
                            {!locked && (
                              <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all group-hover:translate-x-0.5" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Optimized state — show what was applied */}
                {isOptimized && (
                  <div className="px-5 pb-4">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Zap className="w-3 h-3 text-white/50" />
                      <span className="text-[10px] text-white/50">
                        {getTweaksForTier(game.profile, game.optimizedTier === LT.PREMIUM ? 'premium' : game.optimizedTier === LT.PRO ? 'pro' : 'free').length} tweaks applied
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Tier legend */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Zap className="w-4 h-4" />, label: 'Free', desc: 'Game Mode, DVR, animations' },
          { icon: <Star className="w-4 h-4" />, label: 'Pro', desc: 'VBS, GPU scheduling, input, network' },
          { icon: <Crown className="w-4 h-4" />, label: 'Premium', desc: 'Mitigations, realtime, GPU power' },
        ].map((feat, i) => (
          <div key={i} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: 'var(--accent-dim)' }}>
              {feat.icon}
            </div>
            <div className="text-[10px] font-bold text-white">{feat.label}</div>
            <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{feat.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
