'use client'

import { useMemo, useState } from 'react'
import { BarChart3, Gamepad2, Monitor } from 'lucide-react'

interface GameReference {
  name: string
  icon: string
  category: 'competitive' | 'battle-royale' | 'aaa' | 'esports'
}

const GAMES: GameReference[] = [
  { name: 'Fortnite', icon: '🎯', category: 'battle-royale' },
  { name: 'Valorant', icon: '🔫', category: 'esports' },
  { name: 'CS2', icon: '💣', category: 'esports' },
  { name: 'Apex Legends', icon: '🦁', category: 'battle-royale' },
  { name: 'Warzone', icon: '⚔️', category: 'battle-royale' },
  { name: 'GTA V', icon: '🚗', category: 'aaa' },
  { name: 'Cyberpunk 2077', icon: '🌆', category: 'aaa' },
  { name: 'Minecraft', icon: '⛏️', category: 'competitive' },
  { name: 'League of Legends', icon: '🏆', category: 'esports' },
  { name: 'Overwatch 2', icon: '🎯', category: 'esports' },
  { name: 'PUBG', icon: '🪖', category: 'battle-royale' },
  { name: 'Elden Ring', icon: '⚔️', category: 'aaa' },
]

export function FpsComparisonPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const categories = useMemo(() => [
    { id: 'all', label: 'All Games', count: GAMES.length },
    { id: 'esports', label: 'Esports', count: GAMES.filter(g => g.category === 'esports').length },
    { id: 'battle-royale', label: 'Battle Royale', count: GAMES.filter(g => g.category === 'battle-royale').length },
    { id: 'aaa', label: 'AAA', count: GAMES.filter(g => g.category === 'aaa').length },
    { id: 'competitive', label: 'Competitive', count: GAMES.filter(g => g.category === 'competitive').length },
  ], [])
  const games = selectedCategory === 'all' ? GAMES : GAMES.filter(game => game.category === selectedCategory)

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 reveal-up reveal-up-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center gradient-border" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))' }}>
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">FPS Measurement Guide</h1>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">No estimated gains — compare real, repeatable benchmarks on your PC.</p>
          </div>
        </div>

        <div className="rounded-xl p-5 gradient-border reveal-up" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(96,165,250,0.08)' }}>
              <BarChart3 className="w-4 h-4" style={{ color: '#60a5fa' }} />
            </div>
            <div className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>
              Record a baseline in the same scene, resolution, graphics preset, driver version, and power mode. Then change one setting and repeat several runs. Use average FPS, 1% lows, and frame-time consistency; a global Windows tweak does not justify a predicted FPS number.
            </div>
          </div>
        </div>

        <div className="flex gap-2 reveal-up reveal-up-2">
          {categories.map(category => (
            <button key={category.id} onClick={() => setSelectedCategory(category.id)} className="px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all duration-300" style={{
              background: selectedCategory === category.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
              color: selectedCategory === category.id ? '#fff' : 'rgba(255,255,255,0.3)',
              border: `1px solid ${selectedCategory === category.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
            }}>
              {category.label}<span className="ml-1.5 text-[9px] opacity-60">{category.count}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {games.map((game, index) => (
            <div key={game.name} className="rounded-xl p-4 gradient-border reveal-up" style={{ background: 'rgba(255,255,255,0.02)', animationDelay: `${index * 40}ms` }}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{game.icon}</span>
                <div>
                  <div className="text-[12px] font-bold text-white">{game.name}</div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.28)' }}>{game.category.replace('-', ' ')}</div>
                </div>
                <div className="ml-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Benchmark required</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <Monitor className="w-3.5 h-3.5" /> FPS varies with hardware, driver, scene, temperature, background load, and game updates.
        </div>
      </div>
    </div>
  )
}
