'use client'

import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { canAccess } from '@/lib/featureAccess'
import { gameProfiles } from '@/data/games'
import type { GameProfile } from '@/types'
import {
  Gamepad2, Zap, Play, Square, CheckCircle,
  Lock, Monitor,
} from 'lucide-react'

type Tab = 'games' | 'autopilot'

export function AutoPilotPage() {
  const { license, selectedGames, setSelectedGames, autopilotStatus, setAutopilotStatus } = useStore()
  const [tab, setTab] = useState<Tab>('games')
  const hasMulti = canAccess('autopilot_multi', license.tier)

  return (
    <div className="p-5 lg:p-6 space-y-5 fade-in overflow-y-auto h-full">
      <div>
        <h1 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>AutoPilot</h1>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Game profiles & auto-optimization</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
        {([['games', 'Games', Gamepad2], ['autopilot', 'AutoPilot', Zap]] as [Tab, string, any][]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-semibold transition-all" style={{ background: tab === id ? 'var(--accent)' : 'transparent', color: tab === id ? '#fff' : 'var(--text-secondary)', boxShadow: tab === id ? '0 2px 8px rgba(255,255,255,0.25)' : 'none' }}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'games' && <GamesTab hasMulti={hasMulti} selectedGames={selectedGames} setSelectedGames={setSelectedGames} />}
      {tab === 'autopilot' && <AutoPilotTab hasMulti={hasMulti} selectedGames={selectedGames} autopilotStatus={autopilotStatus} setAutopilotStatus={setAutopilotStatus} />}
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

  return (
    <div className="space-y-3">
      {!hasMulti && (
        <div className="p-3 rounded-xl flex items-center gap-2.5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <Lock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Free plan: 1 game. <span style={{ color: 'var(--accent)' }} className="font-bold">PRO</span> plan: unlimited games.</span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3 stagger">
        {gameProfiles.map(game => {
          const selected = selectedGames.some(g => g.id === game.id)
          const locked = !hasMulti && !selected && selectedGames.length >= 1
          return (
            <button key={game.id} onClick={() => !locked && toggle(game)} className="card-widget p-4 text-left transition-all hover-lift card-glow" style={{ borderColor: selected ? 'var(--accent)' : undefined, opacity: locked ? 0.4 : 1 }}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{game.name}</span>
                {selected && <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <Monitor className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{game.tweaks.length} tweaks</span>
              </div>
              <span className="text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: game.priority === 1 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.10)', color: game.priority === 1 ? 'var(--danger)' : 'var(--success)' }}>
                {game.priority === 1 ? 'Competitive' : 'Casual'}
              </span>
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
    <div className="space-y-4">
      <div className="card-widget p-5 card-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: autopilotStatus.active ? 'rgba(255,255,255,0.10)' : 'var(--bg-active)' }}>
              <Zap className="w-3.5 h-3.5" style={{ color: autopilotStatus.active ? 'var(--success)' : 'var(--text-muted)' }} />
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>AutoPilot Status</span>
          </div>
          <div className="flex items-center gap-1.5">
            {autopilotStatus.active ? <div className="live-dot" /> : <div className="w-2 h-2 rounded-full" style={{ background: 'var(--text-muted)' }} />}
            <span className="text-[10px] font-medium" style={{ color: autopilotStatus.active ? 'var(--success)' : 'var(--text-muted)' }}>{autopilotStatus.active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        {autopilotStatus.currentGame && (
          <div className="p-3 rounded-xl mb-4 flex items-center gap-2.5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Gamepad2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
            <span className="text-[11px] font-semibold" style={{ color: 'var(--success)' }}>Playing: {autopilotStatus.currentGame}</span>
          </div>
        )}

        <div className="text-[10px] mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Monitors running processes every 3 seconds. When a selected game launches, tweaks are auto-applied. When it closes, tweaks are reverted.
        </div>

        <div className="text-[10px] mb-4" style={{ color: 'var(--text-secondary)' }}>Monitoring {selectedGames.length} game(s): {selectedGames.map(g => g.name).join(', ') || 'None selected'}</div>

        <button onClick={handleToggle} disabled={loading || selectedGames.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: autopilotStatus.active ? 'var(--danger)' : 'var(--success)', color: '#fff', boxShadow: autopilotStatus.active ? '0 4px 16px rgba(255,255,255,0.25)' : '0 4px 16px rgba(255,255,255,0.25)' }}>
          {autopilotStatus.active ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {loading ? '...' : autopilotStatus.active ? 'Stop AutoPilot' : 'Start AutoPilot'}
        </button>
      </div>
    </div>
  )
}
