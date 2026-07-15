'use client'

import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { Gamepad2, ArrowUp, ArrowDown, TrendingUp, Zap, BarChart3, RefreshCw, Monitor } from 'lucide-react'

interface GameProfile {
  name: string
  icon: string
  baseFps: number
  category: 'competitive' | 'battle-royale' | 'aaa' | 'esports'
  optimizationImpact: number // percentage improvement from tweaks
}

const GAMES: GameProfile[] = [
  { name: 'Fortnite', icon: '🎯', baseFps: 85, category: 'battle-royale', optimizationImpact: 22 },
  { name: 'Valorant', icon: '🔫', baseFps: 180, category: 'esports', optimizationImpact: 15 },
  { name: 'CS2', icon: '💣', baseFps: 140, category: 'esports', optimizationImpact: 18 },
  { name: 'Apex Legends', icon: '🦁', baseFps: 95, category: 'battle-royale', optimizationImpact: 20 },
  { name: 'Warzone', icon: '⚔️', baseFps: 75, category: 'battle-royale', optimizationImpact: 25 },
  { name: 'GTA V', icon: '🚗', baseFps: 90, category: 'aaa', optimizationImpact: 16 },
  { name: 'Cyberpunk 2077', icon: '🌆', baseFps: 55, category: 'aaa', optimizationImpact: 28 },
  { name: 'Minecraft', icon: '⛏️', baseFps: 250, category: 'competitive', optimizationImpact: 12 },
  { name: 'League of Legends', icon: '🏆', baseFps: 200, category: 'esports', optimizationImpact: 10 },
  { name: 'Overwatch 2', icon: '🎯', baseFps: 130, category: 'esports', optimizationImpact: 14 },
  { name: 'PUBG', icon: '🪖', baseFps: 80, category: 'battle-royale', optimizationImpact: 21 },
  { name: 'Elden Ring', icon: '⚔️', baseFps: 50, category: 'aaa', optimizationImpact: 18 },
]

function FpsBar({ game, appliedCount, maxApplied }: { game: GameProfile; appliedCount: number; maxApplied: number }) {
  const boostMultiplier = Math.min(appliedCount / maxApplied, 1)
  const estimatedAfter = Math.round(game.baseFps * (1 + (game.optimizationImpact / 100) * boostMultiplier))
  const fpsGain = estimatedAfter - game.baseFps
  const pctGain = game.baseFps > 0 ? Math.round((fpsGain / game.baseFps) * 100) : 0

  const beforeWidth = Math.min((game.baseFps / 350) * 100, 100)
  const afterWidth = Math.min((estimatedAfter / 350) * 100, 100)

  return (
    <div className="rounded-xl p-4 transition-all duration-300 gradient-border group"
      style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">{game.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-white truncate">{game.name}</div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {game.category.replace('-', ' ')}
          </div>
        </div>
        {fpsGain > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{
            background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.12)',
          }}>
            <ArrowUp className="w-3 h-3" style={{ color: '#4ade80' }} />
            <span className="text-[11px] font-bold" style={{ color: '#4ade80' }}>+{pctGain}%</span>
          </div>
        )}
      </div>

      {/* Before bar */}
      <div className="mb-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>Before</span>
          <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>{game.baseFps} FPS</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{
            width: `${beforeWidth}%`,
            background: 'rgba(255,255,255,0.15)',
          }} />
        </div>
      </div>

      {/* After bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-medium" style={{ color: 'rgba(74,222,128,0.5)' }}>After</span>
          <span className="text-[10px] font-bold" style={{ color: '#4ade80' }}>{estimatedAfter} FPS</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(74,222,128,0.04)' }}>
          <div className="h-full rounded-full transition-all duration-1000 relative" style={{
            width: `${afterWidth}%`,
            background: 'linear-gradient(90deg, rgba(74,222,128,0.5), rgba(74,222,128,0.8))',
            boxShadow: '0 0 12px rgba(74,222,128,0.2)',
          }}>
            <div className="absolute inset-0 rounded-full" style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2))',
            }} />
          </div>
        </div>
      </div>

      {/* FPS Gain */}
      {fpsGain > 0 && (
        <div className="mt-2 flex items-center justify-end gap-1">
          <TrendingUp className="w-3 h-3" style={{ color: '#4ade80' }} />
          <span className="text-[10px] font-bold" style={{ color: '#4ade80' }}>+{fpsGain} FPS</span>
        </div>
      )}
    </div>
  )
}

export function FpsComparisonPage() {
  const { appliedTweaks } = useStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const maxApplied = 20 // reference for boost scaling
  const appliedCount = appliedTweaks.length

  const categories = useMemo(() => [
    { id: 'all', label: 'All Games', count: GAMES.length },
    { id: 'esports', label: 'Esports', count: GAMES.filter(g => g.category === 'esports').length },
    { id: 'battle-royale', label: 'Battle Royale', count: GAMES.filter(g => g.category === 'battle-royale').length },
    { id: 'aaa', label: 'AAA', count: GAMES.filter(g => g.category === 'aaa').length },
    { id: 'competitive', label: 'Competitive', count: GAMES.filter(g => g.category === 'competitive').length },
  ], [])

  const filteredGames = useMemo(() => {
    if (selectedCategory === 'all') return GAMES
    return GAMES.filter(g => g.category === selectedCategory)
  }, [selectedCategory])

  const avgFpsGain = useMemo(() => {
    const gains = filteredGames.map(g => {
      const boostMultiplier = Math.min(appliedCount / maxApplied, 1)
      const after = Math.round(g.baseFps * (1 + (g.optimizationImpact / 100) * boostMultiplier))
      return ((after - g.baseFps) / g.baseFps) * 100
    })
    return gains.length > 0 ? gains.reduce((s, g) => s + g, 0) / gains.length : 0
  }, [filteredGames, appliedCount])

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 reveal-up reveal-up-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center gradient-border" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}>
            <Gamepad2 className="w-5 h-5" style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">FPS Comparison</h1>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Estimated FPS gains based on your applied optimizations</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 reveal-up reveal-up-2">
          <div className="rounded-xl p-4 frosted relative overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full pointer-events-none" style={{
              background: 'radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)',
            }} />
            <div className="relative" style={{ zIndex: 1 }}>
              <div className="text-[9px] uppercase tracking-[0.15em] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Average FPS Gain</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-light" style={{ color: '#4ade80' }}>+{avgFpsGain.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 frosted relative overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative" style={{ zIndex: 1 }}>
              <div className="text-[9px] uppercase tracking-[0.15em] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Optimizations Active</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-light text-white">{appliedCount}</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>/ {maxApplied}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 frosted relative overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative" style={{ zIndex: 1 }}>
              <div className="text-[9px] uppercase tracking-[0.15em] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Games Analyzed</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-light text-white">{filteredGames.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 reveal-up reveal-up-3">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
              className="px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all duration-300 btn-press"
              style={{
                background: selectedCategory === cat.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                color: selectedCategory === cat.id ? '#fff' : 'rgba(255,255,255,0.3)',
                border: `1px solid ${selectedCategory === cat.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
              }}>
              {cat.label}
              <span className="ml-1.5 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredGames.map((game, idx) => (
            <div key={game.name} className="reveal-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <FpsBar game={game} appliedCount={appliedCount} maxApplied={maxApplied} />
            </div>
          ))}
        </div>

        {/* Info Note */}
        <div className="rounded-xl p-4 gradient-border reveal-up" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{
              background: 'rgba(96,165,250,0.08)',
              border: '1px solid rgba(96,165,250,0.12)',
            }}>
              <Monitor className="w-4 h-4" style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-white mb-1">How FPS estimates work</div>
              <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
                FPS estimates are based on typical gains from the optimizations you&apos;ve applied.
                Actual results vary by hardware, game settings, and system configuration.
                Run a benchmark before &amp; after for precise measurements on your system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
