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

const GAME_GENRES: Record<string, string> = {
  'fortnite': 'Battle Royale', 'valorant': 'Tactical FPS', 'league-of-legends': 'MOBA',
  'cs2': 'Competitive FPS', 'apex-legends': 'Battle Royale', 'warzone': 'Battle Royale',
  'minecraft': 'Sandbox', 'fivem': 'Multiplayer', 'gta-v': 'Open World',
  'rainbow-six-siege': 'Tactical FPS', 'pubg': 'Battle Royale',
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
  game: GameProfile
  genre: string
  selected: boolean
  locked: boolean
  isCompetitive: boolean
  onClick: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const imagePath = game.imagePath || `/Assets/Games/${game.id}.jpg`
  const showImage = !imgError && imagePath

  return (
    <button onClick={onClick}
      className="game-card group relative rounded-2xl overflow-hidden text-left transition-all duration-200"
      style={{
        aspectRatio: '16/10',
        border: selected ? '2px solid #fff' : '2px solid transparent',
        boxShadow: selected ? '0 0 20px rgba(255,255,255,0.15)' : 'none',
        opacity: locked ? 0.35 : 1,
        cursor: locked ? 'not-allowed' : 'pointer',
      }}>

      {/* Banner image or placeholder */}
      {showImage ? (
        <img
          src={imagePath}
          alt={game.name}
          className="game-card-image absolute inset-0 w-full h-full object-cover"
          onError={() => setImgError(true)}
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#1a1a1a' }}>
          <span className="text-lg font-bold text-white/20 tracking-widest uppercase">{game.name}</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%)',
      }} />

      {/* Selection indicator (top-right) */}
      <div className="absolute top-3 right-3 z-10">
        {selected ? (
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#fff' }}>
            <CheckCircle className="w-3.5 h-3.5 text-black" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border transition-all duration-200 group-hover:border-white/40" style={{ borderColor: 'rgba(255,255,255,0.25)' }} />
        )}
      </div>

      {/* Content (bottom-left) */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <div className="text-[13px] font-bold text-white leading-tight mb-0.5">{game.name}</div>
        <div className="text-[10px] text-white/50 mb-1.5">{genre}</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Settings2 className="w-2.5 h-2.5 text-white/40" />
            <span className="text-[9px] text-white/50">{game.tweaks.length}</span>
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

      {/* Locked overlay */}
      {locked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <Lock className="w-5 h-5 text-white/30" />
        </div>
      )}
    </button>
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
          <div className="text-[9px] text-[var(--text-muted)] mt-1">Checks every 3 seconds &bull; Tweaks applied on launch &bull; Reverted on close</div>
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
