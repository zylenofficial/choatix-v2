'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import {
  Cpu, MemoryStick, Monitor, HardDrive, Zap, Shield,
  Activity, Gamepad2, ArrowRight, Clock, Wifi,
  Download, Upload, Target, TrendingUp,
  Sparkles, Thermometer, Keyboard,
} from 'lucide-react'
import type { RealtimeStats } from '@/types'
import { DashboardSkeleton } from '@/components/Skeleton'
import { Tooltip } from '@/components/Tooltip'

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

function getBarColor(pct: number): string {
  if (pct > 85) return 'var(--danger)'
  if (pct > 65) return 'var(--warning)'
  return 'var(--success)'
}

function getTempColor(temp: number | null): string {
  if (temp === null) return 'rgba(255,255,255,0.3)'
  if (temp > 80) return 'var(--danger)'
  if (temp > 65) return 'var(--warning)'
  return 'var(--success)'
}

function formatUptime(uptime: string | number): string {
  if (typeof uptime === 'string') return uptime
  const d = Math.floor(uptime / 86400)
  const h = Math.floor((uptime % 86400) / 3600)
  const m = Math.floor((uptime % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function DashboardPage() {
  const [stats, setStats] = useState<RealtimeStats | null>(null)
  const { rollbackEntries, addHealthScoreEntry, appliedTweaks } = useStore()

  const score = useMemo(() => calcHealthScore(stats), [stats])

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
    const id = setInterval(fetchStats, 8000)
    return () => clearInterval(id)
  }, [fetchStats])

  const nav = (page: string) => window.dispatchEvent(new CustomEvent('choatix-navigate', { detail: page }))

  if (!stats) {
    return <DashboardSkeleton />
  }

  const cpuPct = Math.round(stats.cpu.usage)
  const ramPct = Math.round(stats.ram.percentage)
  const gpuPct = Math.round(stats.gpu.usage)
  const diskPct = stats.storage.drives[0]?.percentage || 0

  return (
    <div className="p-6 space-y-5 h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="flex items-end justify-between mb-5 reveal-up reveal-up-1">
          <div>
            <p className="text-[10px] tracking-[0.25em] font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>DASHBOARD</p>
            <h1 className="text-[24px] font-light tracking-tight" style={{ color: '#fff' }}>
              System <span style={{ color: 'rgba(255,255,255,0.3)' }}>Overview</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="live-dot" />
            <span className="text-[10px] font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>LIVE</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex gap-4 mb-5 reveal-up reveal-up-2">
          {/* Score Ring */}
          <div className="relative rounded-2xl p-6 flex flex-col items-center justify-center min-w-[220px]" style={{
            background: 'rgba(15,15,15,0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.04) 0%, transparent 60%)',
              }} />
            </div>

            {/* Score ring */}
            <div className="relative score-glow-pulse" style={{ width: 150, height: 150 }}>
              <svg width={150} height={150} className="transform -rotate-90">
                <defs>
                  <linearGradient id="score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#d4d4d4" />
                    <stop offset="100%" stopColor="#a3a3a3" />
                  </linearGradient>
                </defs>
                <circle stroke="rgba(255,255,255,0.04)" strokeWidth={6} fill="transparent" r={62} cx={75} cy={75} />
                <circle
                  stroke="url(#score-grad)" strokeWidth={6} fill="transparent" r={62}
                  cx={75} cy={75}
                  strokeDasharray={62 * 2 * Math.PI}
                  strokeDashoffset={62 * 2 * Math.PI * (1 - score / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[48px] font-extralight leading-none tracking-tighter" style={{ color: '#fff' }}>
                  {score}
                </span>
                <span className="text-[9px] mt-1 tracking-[0.3em] font-semibold" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  / 100
                </span>
              </div>
            </div>

            <div className="mt-3 text-center">
              <div className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
                System Health
              </div>
              <div className="text-[12px] mt-1 font-semibold tracking-wide" style={{ color: 'var(--success)' }}>
                {getScoreLabel(score).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex-1 grid grid-rows-3 gap-2.5">
            {[
              { icon: Shield, label: 'Scan & Optimize', desc: 'Detect and fix issues', page: 'optimize', color: 'rgba(255,255,255,0.7)' },
              { icon: Sparkles, label: 'Quick Boost', desc: 'One-click performance boost', page: 'quick-boost', color: 'rgba(255,255,255,0.7)' },
              { icon: Gamepad2, label: 'Game Booster', desc: 'Auto-optimize for gaming', page: 'games', color: 'rgba(255,255,255,0.7)' },
            ].map((item, i) => (
              <button key={i} onClick={() => nav(item.page)}
                className="group flex items-center gap-3.5 p-3.5 rounded-xl text-left transition-all duration-200 btn-press"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <item.icon className="w-4.5 h-4.5" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold" style={{ color: '#fff' }}>{item.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{item.desc}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" style={{ color: 'rgba(255,255,255,0.15)' }} />
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-5 gap-3 mb-5 reveal-up reveal-up-3">
          {[
            { icon: Cpu, label: 'CPU', value: `${cpuPct}%`, sub: stats.cpu.model?.split(' ').slice(-2).join(' ') || '', detail: stats.cpu.temperature !== null ? `${stats.cpu.temperature}°C` : '', pct: cpuPct, temp: stats.cpu.temperature },
            { icon: MemoryStick, label: 'RAM', value: `${ramPct}%`, sub: `${(stats.ram.used / 1024).toFixed(1)} / ${(stats.ram.total / 1024).toFixed(0)} GB`, detail: '', pct: ramPct, temp: null },
            { icon: Monitor, label: 'GPU', value: `${gpuPct}%`, sub: stats.gpu.model?.split(' ').slice(-2).join(' ') || '', detail: stats.gpu.temperature !== null ? `${stats.gpu.temperature}°C` : '', pct: gpuPct, temp: stats.gpu.temperature },
            { icon: HardDrive, label: 'DISK', value: `${diskPct}%`, sub: `${stats.storage.drives[0]?.freeGB || 0} GB free`, detail: '', pct: diskPct, temp: null },
            { icon: Clock, label: 'UPTIME', value: formatUptime(stats.system.uptime), sub: stats.system.os, detail: '', pct: 0, temp: null },
          ].map((item, i) => (
            <div key={i} className="rounded-xl px-4 py-3.5 card-glow"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <item.icon className="w-3 h-3 transition-colors group-hover:text-white" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <span className="text-[8px] tracking-[0.2em] font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>{item.label}</span>
                </div>
                {item.temp !== null && (
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-2.5 h-2.5" style={{ color: getTempColor(item.temp) }} />
                    <span className="text-[9px] font-medium" style={{ color: getTempColor(item.temp) }}>{item.temp}°</span>
                  </div>
                )}
              </div>
              <div className="text-[18px] font-light tracking-tight" style={{ color: '#fff' }}>{item.value}</div>
              <div className="text-[9px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.2)' }}>{item.sub}</div>
              {item.pct > 0 && (
                <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${item.pct}%`,
                    background: getBarColor(item.pct),
                    boxShadow: `0 0 8px ${getBarColor(item.pct)}`,
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Network Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-5 reveal-up reveal-up-4">
          {[
            { icon: Wifi, label: 'PING', value: stats.network.latencyMs !== null ? `${Math.round(stats.network.latencyMs)}ms` : '—', sub: 'Latency' },
            { icon: Download, label: 'DOWNLOAD', value: stats.network.downloadSpeed > 0 ? `${(stats.network.downloadSpeed / 1024).toFixed(1)}` : '—', sub: 'Mbps' },
            { icon: Upload, label: 'UPLOAD', value: stats.network.uploadSpeed > 0 ? `${(stats.network.uploadSpeed / 1024).toFixed(1)}` : '—', sub: 'Mbps' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <item.icon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.2)' }}>{item.label}</div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-[14px] font-light" style={{ color: '#fff' }}>{item.value}</span>
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{item.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Row */}
        <div className="flex gap-3 reveal-up reveal-up-5">
          <div className="flex-1 rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.2)' }}>OPTIMIZATIONS</div>
                <div className="text-[14px] font-light" style={{ color: '#fff' }}>
                  {appliedTweaks?.length || 0} applied
                </div>
              </div>
            </div>
            {rollbackEntries.length > 0 && (
              <button onClick={() => nav('settings')}
                className="text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all btn-press"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Rollback
              </button>
            )}
          </div>

          <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Target className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>
            <div>
              <div className="text-[9px] font-bold tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.2)' }}>POWER PLAN</div>
              <div className="text-[12px] font-light" style={{ color: '#fff' }}>
                {stats.system.powerPlan || 'Unknown'}
              </div>
            </div>
          </div>

          <Tooltip content="Press 1-9 to navigate pages" side="bottom">
            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Keyboard className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.2)' }}>SHORTCUTS</div>
                <div className="flex gap-1 mt-1">
                  {['1','2','3','4','5'].map(k => (
                    <span key={k} className="kbd">{k}</span>
                  ))}
                </div>
              </div>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
