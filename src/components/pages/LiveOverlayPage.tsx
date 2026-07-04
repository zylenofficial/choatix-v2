'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Activity, Cpu, MemoryStick, HardDrive, Wifi, Monitor, Thermometer, Zap, RefreshCw, Maximize2, Minimize2 } from 'lucide-react'
import type { RealtimeStats } from '@/types'

type Stats = RealtimeStats

function StatCard({ label, value, sub, icon: Icon, color, mini }: {
  label: string; value: string; sub?: string; icon: any; color: string; mini?: boolean
}) {
  return (
    <div className={`card-widget ${mini ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center gap-3">
        <div className={`${mini ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center`}
          style={{ background: `${color}15` }}>
          <Icon className={`${mini ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`${mini ? 'text-[10px]' : 'text-[11px]'} text-[var(--text-muted)] uppercase tracking-wider`}>{label}</div>
          <div className={`${mini ? 'text-sm' : 'text-base'} font-bold text-white truncate`}>{value}</div>
          {sub && <div className={`${mini ? 'text-[9px]' : 'text-[10px]'} text-[var(--text-muted)] truncate`}>{sub}</div>}
        </div>
      </div>
    </div>
  )
}

function MiniGraph({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * 100
    const y = height - (v / max) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} 100,${height}`} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function RingGauge({ value, max, label, color, size = 80 }: {
  value: number; max: number; label: string; color: string; size?: number
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const circumference = 2 * Math.PI * ((size - 8) / 2)
  const offset = circumference - (pct / 100) * circumference
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={(size-8)/2} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <circle cx={size/2} cy={size/2} r={(size-8)/2} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{label}</div>
    </div>
  )
}

export function LiveOverlayPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [monitoring, setMonitoring] = useState(false)
  const [cpuHistory, setCpuHistory] = useState<number[]>([])
  const [ramHistory, setRamHistory] = useState<number[]>([])
  const [gpuHistory, setGpuHistory] = useState<number[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const s = await window.electronAPI?.getRealtimeStats()
      if (!s) return
      setStats(s)
      setCpuHistory(prev => [...prev.slice(-59), s.cpu.usage])
      setRamHistory(prev => [...prev.slice(-59), s.ram.percentage])
      setGpuHistory(prev => [...prev.slice(-59), s.gpu.usage])
    } catch {}
  }, [])

  const toggleMonitoring = useCallback(() => {
    if (monitoring) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      setMonitoring(false)
    } else {
      fetchStats()
      intervalRef.current = setInterval(fetchStats, 1000)
      setMonitoring(true)
    }
  }, [monitoring, fetchStats])

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const gpuTemp = stats?.gpu?.temperature || 0
  const ramUsedGB = stats ? (stats.ram.used / 1024).toFixed(1) : '0'
  const ramTotalGB = stats ? (stats.ram.total / 1024).toFixed(1) : '0'
  const gpuVramUsed = stats?.gpu?.vram ? (stats.gpu.vram / 2 / 1024).toFixed(1) : '0'

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
              <Activity className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Live Monitor</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Real-time system performance while gaming</p>
            </div>
          </div>
          <button onClick={toggleMonitoring}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover-lift"
            style={{
              background: monitoring ? 'var(--danger)' : '#fff',
              color: monitoring ? '#fff' : '#000',
              boxShadow: monitoring ? '0 4px 20px var(--danger-glow)' : '0 4px 20px rgba(255,255,255,0.15)',
            }}>
            {monitoring ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Stop
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5" />
                Start Monitoring
              </>
            )}
          </button>
        </div>

        {!monitoring && !stats && (
          <div className="rounded-3xl p-16 flex flex-col items-center gap-5 card-widget">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.1)' }}>
              <Activity className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-white mb-1">Click Start to monitor</div>
              <div className="text-xs text-[var(--text-muted)]">See live CPU, GPU, RAM, and network stats</div>
            </div>
          </div>
        )}

        {stats && (
          <>
            {/* Gauges row */}
            <div className="card-widget p-6 flex items-center justify-around">
              <RingGauge value={stats.cpu.usage} max={100} label="CPU" color="var(--info)" />
              <RingGauge value={stats.gpu.usage} max={100} label="GPU" color="var(--success)" />
              <RingGauge value={stats.ram.percentage} max={100} label="RAM" color="var(--warning)" />
              {gpuTemp > 0 && (
                <RingGauge value={gpuTemp} max={100} label="Temp" color={gpuTemp > 80 ? 'var(--danger)' : gpuTemp > 60 ? 'var(--warning)' : 'var(--success)'} />
              )}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="CPU" value={`${stats.cpu.usage}%`} sub={`${stats.cpu.model} • ${stats.cpu.cores} cores`} icon={Cpu} color="var(--info)" />
              <StatCard label="GPU" value={`${stats.gpu.usage}%`} sub={stats.gpu.model || 'N/A'} icon={Monitor} color="var(--success)" />
              <StatCard label="RAM" value={`${ramUsedGB} / ${ramTotalGB} GB`} sub={`${stats.ram.percentage}% used`} icon={MemoryStick} color="var(--warning)" />
              <StatCard label="GPU Memory" value={`${gpuVramUsed} GB`} sub="VRAM usage" icon={HardDrive} color="var(--info)" />
              <StatCard label="Network ↓" value={`${(stats.network.downloadSpeed / 1024).toFixed(1)} MB/s`} sub="Download" icon={Wifi} color="var(--success)" />
              <StatCard label="Network ↑" value={`${(stats.network.uploadSpeed / 1024).toFixed(1)} MB/s`} sub="Upload" icon={Wifi} color="var(--warning)" />
            </div>

            {/* Live graphs */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white">Live Graphs</h2>

              <div className="card-widget p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white">CPU Usage</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--info)' }}>{stats.cpu.usage}%</span>
                </div>
                <MiniGraph data={cpuHistory} color="var(--info)" height={50} />
              </div>

              <div className="card-widget p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white">GPU Usage</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>{stats.gpu.usage}%</span>
                </div>
                <MiniGraph data={gpuHistory} color="var(--success)" height={50} />
              </div>

              <div className="card-widget p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white">RAM Usage</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--warning)' }}>{stats.ram.percentage}%</span>
                </div>
                <MiniGraph data={ramHistory} color="var(--warning)" height={50} />
              </div>
            </div>

            {/* Network info */}
            <div className="card-widget p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wifi className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  <span className="text-xs font-bold text-white">{stats.network.adapterName || 'Network'}</span>
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">{stats.network.ipAddress || ''}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
