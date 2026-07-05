'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import {
  Cpu, MemoryStick, Monitor, HardDrive, Zap, Shield,
  Activity, Gamepad2, ChevronRight, ArrowRight,
  Power, Clock, Thermometer,
} from 'lucide-react'
import type { RealtimeStats } from '@/types'

function calcHealthScore(stats: RealtimeStats | null): number {
  if (!stats) return 0
  let score = 100
  const cpu = stats.cpu.usage
  const ram = stats.ram.percentage
  const gpu = stats.gpu.usage
  if (cpu > 80) score -= 15
  else if (cpu > 60) score -= 8
  else if (cpu > 40) score -= 3
  if (ram > 85) score -= 20
  else if (ram > 70) score -= 10
  else if (ram > 50) score -= 4
  if (gpu > 90) score -= 15
  else if (gpu > 70) score -= 8
  const temp = stats.cpu.temperature
  if (temp !== null) {
    if (temp > 85) score -= 20
    else if (temp > 75) score -= 10
    else if (temp > 65) score -= 4
  }
  if (stats.storage.drives.some(d => d.percentage > 90)) score -= 5
  if (stats.system.gameMode === false || stats.system.gameMode === "0") score -= 3
  if (!stats.system.powerPlan.toLowerCase().includes('high')) score -= 5
  return Math.max(0, Math.min(100, score))
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 50) return 'Fair'
  if (score >= 25) return 'Poor'
  return 'Critical'
}

function getScoreColor(score: number) {
  if (score >= 80) return '#ffffff'
  if (score >= 50) return '#cccccc'
  return '#999999'
}

function formatUptime(uptime: string | number): string {
  if (typeof uptime === 'string') return uptime
  const d = Math.floor(uptime / 86400)
  const h = Math.floor((uptime % 86400) / 3600)
  const m = Math.floor((uptime % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function DashboardPage() {
  const [stats, setStats] = useState<RealtimeStats | null>(null)
  const { rollbackEntries, addHealthScoreEntry } = useStore()

  const score = useMemo(() => calcHealthScore(stats), [stats])
  const scoreCol = getScoreColor(score)

  const fetchStats = useCallback(async () => {
    try {
      const s = await window.electronAPI?.getRealtimeStats()
      if (!s) return
      setStats(s)
      addHealthScoreEntry({ score: calcHealthScore(s), timestamp: Date.now() })
    } catch {}
  }, [addHealthScoreEntry])

  useEffect(() => {
    fetchStats()
    const id = setInterval(fetchStats, 10000)
    return () => clearInterval(id)
  }, [fetchStats])

  const nav = (page: string) => window.dispatchEvent(new CustomEvent('choatix-navigate', { detail: page }))

  if (!stats) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 pulse-glow" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Activity className="w-8 h-8 scan-pulse" style={{ color: '#ffffff' }} />
        </div>
        <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading system data</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      {/* Welcome */}
      <div>
        <p className="text-[10px] tracking-[0.2em] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>WELCOME BACK</p>
        <h1 className="text-[22px] font-light tracking-tight" style={{ color: '#fff' }}>Choatix <span style={{ color: 'rgba(255,255,255,0.35)' }}>Home</span></h1>
      </div>

      {/* Hero: Score + 3 Action Cards */}
      <div className="flex gap-5 items-stretch">
        {/* Health Score */}
        <div className="relative rounded-2xl p-6 flex flex-col items-center justify-center min-w-[200px] glass" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 30%, ${scoreCol}18 0%, transparent 60%)` }} />
          <div className="relative score-glow-pulse" style={{ width: 140, height: 140, '--ring-glow': `${scoreCol}50` } as any}>
            <svg width={140} height={140} className="transform -rotate-90">
              <defs>
                <linearGradient id="score-grad-home" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={scoreCol} />
                  <stop offset="100%" stopColor={scoreCol + '80'} />
                </linearGradient>
              </defs>
              <circle stroke="rgba(255,255,255,0.04)" strokeWidth={8} fill="transparent" r={58} cx={70} cy={70} />
              <circle
                stroke="url(#score-grad-home)" strokeWidth={8} fill="transparent" r={58}
                cx={70} cy={70}
                strokeDasharray={58 * 2 * Math.PI}
                strokeDashoffset={58 * 2 * Math.PI * (1 - score / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 20px ${scoreCol}50)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[44px] font-light leading-none" style={{ color: '#fff' }}>{score}</span>
              <span className="text-[10px] mt-1 tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.2)' }}>/ 100</span>
            </div>
          </div>
          <div className="text-[11px] font-medium mt-3 tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>SYSTEM HEALTH</div>
          <div className="text-[10px] mt-0.5 font-semibold" style={{ color: scoreCol }}>{getScoreLabel(score).toUpperCase()}</div>
        </div>

        {/* Action Cards */}
        <div className="flex-1 grid grid-rows-3 gap-3">
          {/* Scan & Fix */}
          <button onClick={() => nav('optimize')}
            className="group flex items-center gap-4 p-4 rounded-2xl text-left transition-all btn-press"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Shield className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold" style={{ color: '#fff' }}>Scan & Optimize</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Detect issues and apply fixes</div>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: 'rgba(255,255,255,0.2)' }} />
          </button>

          {/* One-Click Optimize */}
          <button onClick={() => nav('optimize')}
            className="group flex items-center gap-4 p-4 rounded-2xl text-left transition-all btn-press"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Zap className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold" style={{ color: '#fff' }}>Best Tweaks</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Curated gaming optimizations</div>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: 'rgba(255,255,255,0.2)' }} />
          </button>

          {/* Game Booster */}
          <button onClick={() => nav('autopilot')}
            className="group flex items-center gap-4 p-4 rounded-2xl text-left transition-all btn-press"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Gamepad2 className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold" style={{ color: '#fff' }}>Game Booster</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Auto-optimize when you play</div>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: 'rgba(255,255,255,0.2)' }} />
          </button>
        </div>
      </div>

      {/* System Quick Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { icon: Cpu, label: 'CPU', value: `${Math.round(stats.cpu.usage)}%`, sub: stats.cpu.temperature !== null ? `${stats.cpu.temperature}°C` : '' },
          { icon: MemoryStick, label: 'RAM', value: `${Math.round(stats.ram.percentage)}%`, sub: `${(stats.ram.used / 1024).toFixed(1)} GB` },
          { icon: Monitor, label: 'GPU', value: `${Math.round(stats.gpu.usage)}%`, sub: stats.gpu.model },
          { icon: HardDrive, label: 'Disk', value: `${stats.storage.drives[0]?.percentage || 0}%`, sub: `${stats.storage.drives[0]?.freeGB || 0} GB free` },
          { icon: Clock, label: 'Uptime', value: formatUptime(stats.system.uptime), sub: stats.system.os },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="rounded-xl px-4 py-3 transition-all duration-300 hover:border-[rgba(255,255,255,0.10)]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span className="text-[9px] tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.25)' }}>{item.label}</span>
              </div>
              <div className="text-[16px] font-light" style={{ color: '#fff' }}>{item.value}</div>
              <div className="text-[9px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.2)' }}>{item.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Status bar */}
      {rollbackEntries.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="live-dot" />
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {rollbackEntries.length} optimization{rollbackEntries.length > 1 ? 's' : ''} applied
          </span>
          <button onClick={() => nav('rollback')} className="text-[10px] ml-auto font-semibold btn-press" style={{ color: 'rgba(255,255,255,0.5)' }}>
            View Rollback →
          </button>
        </div>
      )}
    </div>
  )
}
