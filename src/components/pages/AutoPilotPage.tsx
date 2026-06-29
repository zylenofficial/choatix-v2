'use client'

import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { canAccess } from '@/lib/featureAccess'
import { gameProfiles } from '@/data/games'
import type { GameProfile } from '@/types'
import {
  Gamepad2, Zap, Play, Square, CheckCircle,
  Lock, Monitor, Settings2, Shield, ArrowRight, Loader2, Cpu, Wifi, MousePointer, Sparkles,
} from 'lucide-react'

type Tab = 'games' | 'autopilot'

const GAME_ICONS: Record<string, string> = {
  'fortnite': '🎯', 'valorant': '🔫', 'league-of-legends': '⚔️', 'cs2': '💣',
  'apex-legends': '🪂', 'warzone': '⚔️', 'overwatch-2': '🎯', 'minecraft': '⛏️',
  'roblox': '🏗️', 'fivem': '🚗', 'gta-v': '🏙️', 'rocket-league': '⚽',
  'rainbow-six-siege': '🔫', 'pubg': '🪖', 'destiny-2': '🌟',
}

const GAME_TYPES: Record<string, string> = {
  'fortnite': 'Battle Royale', 'valorant': 'Tactical FPS', 'league-of-legends': 'MOBA',
  'cs2': 'Competitive FPS', 'apex-legends': 'Battle Royale', 'warzone': 'Battle Royale',
  'overwatch-2': 'Hero Shooter', 'minecraft': 'Sandbox', 'roblox': 'Sandbox',
  'fivem': 'Multiplayer', 'gta-v': 'Open World', 'rocket-league': 'Sports',
  'rainbow-six-siege': 'Tactical FPS', 'pubg': 'Battle Royale', 'destiny-2': 'Looter Shooter',
}

export function AutoPilotPage() {
  const { license, selectedGames, setSelectedGames, autopilotStatus, setAutopilotStatus } = useStore()
  const [tab, setTab] = useState<Tab>('games')
  const hasMulti = canAccess('autopilot_multi', license.tier)

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
                <Gamepad2 className="w-6 h-6 text-black" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#333', border: '2px solid #000' }}>
                {autopilotStatus.active ? <div className="live-dot" /> : <Zap className="w-2 h-2 text-white" />}
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">AutoPilot</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Auto-optimize when you launch a game</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl fade-in" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          {([['games', 'Game Library', Gamepad2], ['autopilot', 'AutoPilot Control', Zap]] as [Tab, string, any][]).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all duration-300"
              style={{
                background: tab === id ? '#fff' : 'transparent',
                color: tab === id ? '#000' : 'var(--text-secondary)',
                boxShadow: tab === id ? '0 2px 12px rgba(255,255,255,0.2)' : 'none',
              }}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'games' && <GamesTab hasMulti={hasMulti} selectedGames={selectedGames} setSelectedGames={setSelectedGames} />}
        {tab === 'autopilot' && <AutoPilotTab hasMulti={hasMulti} selectedGames={selectedGames} autopilotStatus={autopilotStatus} setAutopilotStatus={setAutopilotStatus} />}
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
      {/* Pro gate banner */}
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

      {/* Selected count */}
      {selectedGames.length > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <div className="w-2 h-2 rounded-full" style={{ background: '#fff' }} />
          {selectedGames.length} game{selectedGames.length > 1 ? 's' : ''} selected for auto-optimization
        </div>
      )}

      {/* Game Grid */}
      <div className="grid grid-cols-3 gap-3 stagger">
        {gameProfiles.map(game => {
          const selected = selectedIds.has(game.id)
          const locked = !hasMulti && !selected && selectedGames.length >= 1
          const icon = GAME_ICONS[game.id] || '🎮'
          const type = GAME_TYPES[game.id] || 'Game'

          return (
            <button key={game.id} onClick={() => !locked && toggle(game)}
              className="group relative p-5 rounded-2xl text-left transition-all duration-300 hover-lift"
              style={{
                background: selected ? 'rgba(255,255,255,0.08)' : 'var(--bg-secondary)',
                border: `1px solid ${selected ? 'rgba(255,255,255,0.2)' : 'var(--border-subtle)'}`,
                opacity: locked ? 0.35 : 1,
                cursor: locked ? 'not-allowed' : 'pointer',
              }}>
              {/* Selection indicator */}
              <div className="absolute top-4 right-4">
                {selected ? (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#fff' }}>
                    <CheckCircle className="w-3.5 h-3.5 text-black" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border transition-all group-hover:border-white/30" style={{ borderColor: 'var(--border-subtle)' }} />
                )}
              </div>

              {/* Game icon + name */}
              <div className="text-2xl mb-3">{icon}</div>
              <div className="text-sm font-bold text-white mb-1">{game.name}</div>
              <div className="text-[10px] text-[var(--text-muted)] mb-3">{type}</div>

              {/* Stats */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Settings2 className="w-3 h-3 text-[var(--text-muted)]" />
                  <span className="text-[9px] text-[var(--text-muted)]">{game.tweaks.length} tweaks</span>
                </div>
                <span className="text-[8px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                  style={{
                    background: game.priority === 1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                    color: game.priority === 1 ? '#fff' : '#999',
                  }}>
                  {game.priority === 1 ? 'Competitive' : 'Casual'}
                </span>
              </div>

              {/* Locked overlay */}
              {locked && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <Lock className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AutoPilotTab({ hasMulti, selectedGames, autopilotStatus, setAutopilotStatus }: { hasMulti: boolean; selectedGames: GameProfile[]; autopilotStatus: { active: boolean; currentGame: string | null }; setAutopilotStatus: (s: { active: boolean; currentGame: string | null }) => void }) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsub = window.electronAPI?.onAutopilotEvent((event) => {
      if (event.type === 'game-started') setAutopilotStatus({ active: true, currentGame: event.game })
      if (event.type === 'game-closed') setAutopilotStatus({ active: true, currentGame: null })
    })
    return () => { unsub?.() }
  }, [setAutopilotStatus])

  const handleToggle = useCallback(async () => {
    setLoading(true)
    if (autopilotStatus.active) {
      await window.electronAPI?.stopAutopilot()
      setAutopilotStatus({ active: false, currentGame: null })
    } else {
      await window.electronAPI?.startAutopilot(selectedGames)
      setAutopilotStatus({ active: true, currentGame: null })
    }
    setLoading(false)
  }, [autopilotStatus.active, selectedGames, setAutopilotStatus])

  return (
    <div className="space-y-5 fade-in">

      {/* Status card */}
      <div className="rounded-3xl p-8 flex flex-col items-center gap-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
        {/* Large status ring */}
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-elevated)" strokeWidth="6" />
            <circle cx="60" cy="60" r="52" fill="none"
              stroke={autopilotStatus.active ? '#fff' : 'var(--bg-elevated)'}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={autopilotStatus.active ? '326.7 0' : '0 326.7'}
              style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {autopilotStatus.active ? (
              <div className="live-dot" style={{ width: 12, height: 12 }} />
            ) : (
              <Zap className="w-8 h-8 text-[var(--text-muted)]" />
            )}
            <div className="text-sm font-bold text-white mt-2">
              {autopilotStatus.active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        {/* Current game banner */}
        {autopilotStatus.currentGame && (
          <div className="w-full max-w-md p-4 rounded-2xl flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">Now Playing</div>
              <div className="text-sm font-bold text-white mt-0.5">{autopilotStatus.currentGame}</div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Sparkles className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white">Optimized</span>
            </div>
          </div>
        )}

        {/* Info features */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
          {[
            { icon: <Cpu className="w-4 h-4" />, label: 'Auto-detect', desc: 'Finds running games' },
            { icon: <Zap className="w-4 h-4" />, label: 'Auto-apply', desc: 'Applies tweaks instantly' },
            { icon: <Shield className="w-4 h-4" />, label: 'Auto-revert', desc: 'Restores on game close' },
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

        {/* Monitoring info */}
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-muted)]">
            Monitoring <span className="text-white font-bold">{selectedGames.length}</span> game{selectedGames.length !== 1 ? 's' : ''}:
            <span className="text-[var(--text-secondary)]"> {selectedGames.map(g => g.name).join(', ') || 'None selected'}</span>
          </div>
          <div className="text-[9px] text-[var(--text-muted)] mt-1">Checks every 3 seconds • Tweaks applied on launch • Reverted on close</div>
        </div>

        {/* Toggle button */}
        <button onClick={handleToggle} disabled={loading || selectedGames.length === 0}
          className="w-full max-w-md py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-300 hover-lift disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: autopilotStatus.active ? '#999' : '#fff',
            color: autopilotStatus.active ? '#000' : '#000',
            boxShadow: autopilotStatus.active ? '0 4px 20px rgba(153,153,153,0.3)' : '0 4px 20px rgba(255,255,255,0.15)',
          }}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : autopilotStatus.active ? (
            <Square className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {loading ? 'Toggling...' : autopilotStatus.active ? 'Stop AutoPilot' : 'Start AutoPilot'}
        </button>

        {selectedGames.length === 0 && (
          <div className="text-[10px] text-[var(--text-muted)]">Select games in the Game Library tab first</div>
        )}
      </div>
    </div>
  )
}
