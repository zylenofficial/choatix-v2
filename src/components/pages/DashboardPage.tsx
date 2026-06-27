'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import {
  Cpu, MemoryStick, Monitor, HardDrive, Wifi, Zap, Clock,
  Activity, Shield, Gauge, Trash2, Download,
  ArrowUp, ArrowDown,
  Power, Gamepad2, HardDriveDownload, History, TrendingUp,
} from 'lucide-react'
import type { RealtimeStats, RollbackEntry } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

function getUsageColor(pct: number): string {
  if (pct >= 80) return 'var(--danger)'
  if (pct >= 50) return 'var(--warning)'
  return 'var(--success)'
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 1048576) return `${(bytesPerSec / 1048576).toFixed(1)} MB/s`
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`
  return `${Math.round(bytesPerSec)} B/s`
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
  const storageWarn = stats.storage.drives.some(d => d.percentage > 90)
  if (storageWarn) score -= 5
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

function CircularGauge({ value, size = 100, strokeWidth = 6, color, label, sub }: {
  value: number; size?: number; strokeWidth?: number; color: string; label: string; sub?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle stroke="var(--bg-active)" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
          <circle
            stroke={color} strokeWidth={strokeWidth} fill="transparent" r={radius}
            cx={size / 2} cy={size / 2}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none count-animate" style={{ color }}>{Math.round(value)}%</span>
          <span className="text-[9px] mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        </div>
      </div>
      {sub && <span className="text-[10px] text-center" style={{ color: 'var(--text-tertiary)' }}>{sub}</span>}
    </div>
  )
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-active)' }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(value, 100)}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
    </div>
  )
}

function DriveCard({ drive }: { drive: { letter: string; totalGB: number; usedGB: number; freeGB: number; percentage: number } }) {
  const color = getUsageColor(drive.percentage)
  return (
    <div className="card-widget p-4 card-glow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}10`, border: `1px solid ${color}18` }}>
            <HardDriveDownload className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{drive.letter}</span>
            <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{drive.freeGB} GB free</div>
          </div>
        </div>
        <span className="text-[13px] font-bold" style={{ color }}>{drive.percentage}%</span>
      </div>
      <MiniBar value={drive.percentage} color={color} />
      <div className="flex justify-between mt-2">
        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{drive.usedGB} GB used</span>
        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{drive.totalGB} GB total</span>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2.5">
        <Icon className="w-3.5 h-3.5" style={{ color: color || 'var(--text-muted)' }} />
        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  )
}

function ActivityItem({ icon: Icon, text, time, color }: { icon: any; text: string; time: string; color: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}10`, border: `1px solid ${color}15` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{text}</div>
        <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{time}</div>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, desc, color, onClick }: {
  icon: any; label: string; desc: string; color: string; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="card-widget p-3.5 flex items-center gap-3 w-full text-left transition-all hover-lift card-glow"
      style={{ cursor: 'pointer' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}10`, border: `1px solid ${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</div>
        <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>
      </div>
    </button>
  )
}

export function DashboardPage() {
  const [stats, setStats] = useState<RealtimeStats | null>(null)
  const [cpuHistory, setCpuHistory] = useState<number[]>([])
  const [ramHistory, setRamHistory] = useState<number[]>([])
  const [gpuHistory, setGpuHistory] = useState<number[]>([])
  const cpuRef = useRef<number[]>([])
  const ramRef = useRef<number[]>([])
  const gpuRef = useRef<number[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [cacheStatus, setCacheStatus] = useState<string | null>(null)
  const { rollbackEntries, advisorResult, addHealthScoreEntry } = useStore()

  const score = useMemo(() => calcHealthScore(stats), [stats])
  const scoreColor = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'

  const fetchStats = useCallback(async () => {
    try {
      const s = await window.electronAPI?.getRealtimeStats()
      if (!s) return
      setStats(s)
      setLastUpdate(new Date())
      cpuRef.current = [...cpuRef.current.slice(-59), s.cpu.usage]
      ramRef.current = [...ramRef.current.slice(-59), s.ram.percentage]
      gpuRef.current = [...gpuRef.current.slice(-59), s.gpu.usage]
      setCpuHistory([...cpuRef.current])
      setRamHistory([...ramRef.current])
      setGpuHistory([...gpuRef.current])
      const newScore = calcHealthScore(s)
      const entry = { score: newScore, timestamp: Date.now() }
      addHealthScoreEntry(entry)
    } catch {}
  }, [])

  useEffect(() => {
    fetchStats()
    const id = setInterval(fetchStats, 10000)
    return () => clearInterval(id)
  }, [fetchStats])

  const handleClearCache = useCallback(async () => {
    setCacheStatus('Clearing...')
    const res = await window.electronAPI?.clearCache()
    setCacheStatus(res?.success ? 'Cache cleared' : 'Failed')
    setTimeout(() => setCacheStatus(null), 3000)
  }, [])

  const handleUpdateDrivers = useCallback(async () => {
    await window.electronAPI?.openDriverUpdate()
  }, [])

  const cpuChartData = useMemo(() => ({
    labels: cpuHistory.map(() => ''),
    datasets: [{
      data: cpuHistory,
      borderColor: 'var(--success)',
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart
        const { ctx: c, chartArea } = chart
        if (!chartArea) return 'rgba(255,255,255,0.10)'
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(255,255,255,0.35)')
        gradient.addColorStop(1, 'rgba(255,255,255,0.02)')
        return gradient
      },
      fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2.5,
    }],
  }), [cpuHistory])

  const ramChartData = useMemo(() => ({
    labels: ramHistory.map(() => ''),
    datasets: [{
      data: ramHistory,
      borderColor: 'var(--info)',
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart
        const { ctx: c, chartArea } = chart
        if (!chartArea) return 'rgba(255,255,255,0.08)'
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(255,255,255,0.30)')
        gradient.addColorStop(1, 'rgba(255,255,255,0.02)')
        return gradient
      },
      fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2.5,
    }],
  }), [ramHistory])

  const gpuChartData = useMemo(() => ({
    labels: gpuHistory.map(() => ''),
    datasets: [{
      data: gpuHistory,
      borderColor: 'var(--warning)',
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart
        const { ctx: c, chartArea } = chart
        if (!chartArea) return 'rgba(255,255,255,0.06)'
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(255,255,255,0.28)')
        gradient.addColorStop(1, 'rgba(255,255,255,0.02)')
        return gradient
      },
      fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2.5,
    }],
  }), [gpuHistory])

  const chartOpts = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { min: 0, max: 100, display: false } },
    animation: { duration: 0 },
    elements: { line: { borderWidth: 1.5 } },
  }), [])

  const recentActivity = useMemo(() => {
    const items: { icon: any; text: string; time: string; color: string }[] = []
    if (stats) {
      if (stats.system.gameMode === true || stats.system.gameMode === "1") {
        items.push({ icon: Gamepad2, text: 'Game Mode active', time: 'Now', color: 'var(--success)' })
      }
      if (stats.system.powerPlan.toLowerCase().includes('high')) {
        items.push({ icon: Zap, text: `Power Plan: ${stats.system.powerPlan}`, time: 'Now', color: 'var(--warning)' })
      }
      if (stats.cpu.usage > 80) {
        items.push({ icon: Cpu, text: `High CPU usage: ${Math.round(stats.cpu.usage)}%`, time: 'Now', color: 'var(--danger)' })
      }
      if (stats.ram.percentage > 80) {
        items.push({ icon: MemoryStick, text: `High memory usage: ${stats.ram.percentage}%`, time: 'Now', color: 'var(--danger)' })
      }
    }
    if (advisorResult) {
      items.push({
        icon: Shield, text: `System scan completed — Score: ${advisorResult.score}/100`,
        time: new Date(advisorResult.timestamp).toLocaleTimeString(), color: 'var(--info)',
      })
      if (advisorResult.issues.length > 0) {
        items.push({
          icon: Activity, text: `${advisorResult.issues.length} optimization${advisorResult.issues.length > 1 ? 's' : ''} available`,
          time: new Date(advisorResult.timestamp).toLocaleTimeString(), color: 'var(--warning)',
        })
      }
    }
    rollbackEntries.slice(-3).reverse().forEach((e: RollbackEntry) => {
      items.push({
        icon: History, text: `Applied: ${e.tweakId}`, time: new Date(e.timestamp).toLocaleTimeString(), color: 'var(--info)',
      })
    })
    return items.slice(0, 6)
  }, [stats, advisorResult, rollbackEntries])

  if (!stats) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 pulse-glow" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <Activity className="w-8 h-8 scan-pulse" style={{ color: 'var(--accent)' }} />
        </div>
        <p className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Loading system data</p>
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Gathering hardware information</p>
      </div>
    )
  }

  const cpuTempStr = stats.cpu.temperature !== null ? `${stats.cpu.temperature}°C` : 'N/A'
  const gpuTempStr = stats.gpu.temperature !== null ? `${stats.gpu.temperature}°C` : 'N/A'
  const gpuVramStr = stats.gpu.vram > 0 ? `${stats.gpu.vram} MB` : 'N/A'

  return (
    <div className="p-5 lg:p-6 space-y-5 fade-in overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Last updated: {lastUpdate.toLocaleTimeString()} · Auto-refreshing
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="live-dot" />
          <span className="text-[9px] font-bold tracking-wide" style={{ color: 'var(--success)' }}>LIVE</span>
        </div>
      </div>

      {/* Health Score + Gauges */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Health Score */}
        <div className="card-widget p-6 flex flex-col items-center justify-center min-w-[170px] lg:min-w-[190px] card-glow relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 40%, ${scoreColor}10 0%, transparent 60%)` }} />
          <div className="relative" style={{ width: 130, height: 130 }}>
            <svg width={130} height={130} className="transform -rotate-90">
              <circle stroke="var(--bg-active)" strokeWidth={7} fill="transparent" r={56} cx={65} cy={65} />
              <circle
                stroke={scoreColor} strokeWidth={7} fill="transparent" r={56}
                cx={65} cy={65}
                strokeDasharray={56 * 2 * Math.PI}
                strokeDashoffset={56 * 2 * Math.PI * (1 - score / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 12px ${scoreColor}40)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold leading-none count-animate" style={{ color: scoreColor }}>{score}</span>
              <span className="text-[9px] mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>
          <div className="text-[13px] font-semibold mt-3" style={{ color: 'var(--text-primary)' }}>System Health</div>
          <div className="text-[10px] font-medium" style={{ color: scoreColor }}>{getScoreLabel(score)}</div>
        </div>

        {/* Gauges */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card-widget p-4 flex flex-col items-center card-glow">
            <CircularGauge value={stats.cpu.usage} color={getUsageColor(stats.cpu.usage)} label="CPU" size={90} strokeWidth={6} />
            <div className="mt-3 space-y-1.5 w-full">
              <div className="flex justify-between"><span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Temp</span><span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{cpuTempStr}</span></div>
              <div className="flex justify-between"><span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Cores</span><span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{stats.cpu.cores}C / {stats.cpu.threads}T</span></div>
              <div className="flex justify-between"><span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Clock</span><span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{stats.cpu.clock > 0 ? `${(stats.cpu.clock / 1000).toFixed(1)} GHz` : 'N/A'}</span></div>
            </div>
          </div>

          <div className="card-widget p-4 flex flex-col items-center card-glow">
            <CircularGauge value={stats.ram.percentage} color={getUsageColor(stats.ram.percentage)} label="RAM" size={90} strokeWidth={6} />
            <div className="mt-3 space-y-1.5 w-full">
              <div className="flex justify-between"><span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Used</span><span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{formatBytes(stats.ram.used * 1024 * 1024)}</span></div>
              <div className="flex justify-between"><span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Total</span><span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{formatBytes(stats.ram.total * 1024 * 1024)}</span></div>
              <div className="flex justify-between"><span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Free</span><span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{formatBytes(stats.ram.available * 1024 * 1024)}</span></div>
            </div>
          </div>

          <div className="card-widget p-4 flex flex-col items-center card-glow">
            <CircularGauge value={stats.gpu.usage} color={getUsageColor(stats.gpu.usage)} label="GPU" size={90} strokeWidth={6} />
            <div className="mt-3 space-y-1.5 w-full">
              <div className="flex justify-between"><span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Temp</span><span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{gpuTempStr}</span></div>
              <div className="flex justify-between"><span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>VRAM</span><span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{gpuVramStr}</span></div>
              <div className="flex justify-between truncate"><span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Model</span><span className="text-[10px] font-medium truncate ml-1" style={{ color: 'var(--text-primary)' }}>{stats.gpu.model}</span></div>
            </div>
          </div>

          <div className="card-widget p-4 flex flex-col items-center card-glow">
            {stats.storage.drives.length > 0 ? (
              <>
                <CircularGauge
                  value={stats.storage.drives[0].percentage}
                  color={getUsageColor(stats.storage.drives[0].percentage)}
                  label={stats.storage.drives[0].letter}
                  size={90} strokeWidth={6}
                />
                <div className="mt-3 space-y-1.5 w-full">
                  <div className="flex justify-between"><span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Used</span><span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{stats.storage.drives[0].usedGB} GB</span></div>
                  <div className="flex justify-between"><span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Free</span><span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{stats.storage.drives[0].freeGB} GB</span></div>
                  <div className="flex justify-between"><span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Total</span><span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{stats.storage.drives[0].totalGB} GB</span></div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <HardDrive className="w-8 h-8 mb-2" style={{ color: 'var(--text-muted)' }} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>No drives detected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card-widget p-4 card-glow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--success)', boxShadow: '0 0 8px var(--success-glow)' }} />
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>CPU Usage</span>
          </div>
          <div style={{ height: 120 }}><Line data={cpuChartData} options={chartOpts} /></div>
        </div>
        <div className="card-widget p-4 card-glow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--info)', boxShadow: '0 0 8px var(--info-glow)' }} />
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>RAM Usage</span>
          </div>
          <div style={{ height: 120 }}><Line data={ramChartData} options={chartOpts} /></div>
        </div>
        <div className="card-widget p-4 card-glow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--warning)', boxShadow: '0 0 8px var(--warning-glow)' }} />
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>GPU Usage</span>
          </div>
          <div style={{ height: 120 }}><Line data={gpuChartData} options={chartOpts} /></div>
        </div>
      </div>

      {/* Storage Drives */}
      {stats.storage.drives.length > 1 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>All Drives</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 stagger">
            {stats.storage.drives.map(d => <DriveCard key={d.letter} drive={d} />)}
          </div>
        </div>
      )}

      {/* System Info / Network / Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card-widget p-4 card-glow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'var(--info-dim)' }}>
              <Gauge className="w-3 h-3" style={{ color: 'var(--info)' }} />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>System Info</span>
          </div>
          <div className="space-y-0">
            <InfoRow icon={Power} label="Power Plan" value={stats.system.powerPlan} />
            <InfoRow icon={Gamepad2} label="Game Mode" value={stats.system.gameMode === true || stats.system.gameMode === "1" ? 'Enabled' : 'Disabled'} color={stats.system.gameMode === true || stats.system.gameMode === "1" ? 'var(--success)' : undefined} />
            <InfoRow icon={Monitor} label="OS" value={stats.system.os} />
            <InfoRow icon={Clock} label="Uptime" value={formatUptime(stats.system.uptime)} />
            <InfoRow icon={Activity} label="Processes" value={`${stats.system.processes}`} />
          </div>
        </div>

        <div className="card-widget p-4 card-glow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <Wifi className="w-3 h-3" style={{ color: 'var(--accent)' }} />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Network</span>
          </div>
          <div className="space-y-0">
            <InfoRow icon={ArrowDown} label="Download" value={formatSpeed(stats.network.downloadSpeed)} color="var(--success)" />
            <InfoRow icon={ArrowUp} label="Upload" value={formatSpeed(stats.network.uploadSpeed)} color="var(--info)" />
            <InfoRow icon={Wifi} label="Adapter" value={stats.network.adapterName} />
          </div>
        </div>

        <div className="card-widget p-4 card-glow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'var(--success-dim)' }}>
              <Zap className="w-3 h-3" style={{ color: 'var(--success)' }} />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Quick Actions</span>
          </div>
          <div className="space-y-2">
            <QuickAction icon={Shield} label="Scan System" desc="Detect performance issues" color="var(--info)" onClick={() => window.location.reload()} />
            <QuickAction icon={Zap} label="Optimize All" desc="Apply recommended fixes" color="var(--success)" onClick={() => window.location.reload()} />
            <QuickAction
              icon={Trash2}
              label={cacheStatus || 'Clear Cache'}
              desc="Remove temporary files"
              color="var(--warning)"
              onClick={handleClearCache}
            />
            <QuickAction icon={Download} label="Update Drivers" desc="Get latest GPU drivers" color="var(--accent)" onClick={handleUpdateDrivers} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-widget p-4 card-glow">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <TrendingUp className="w-3 h-3" style={{ color: 'var(--accent)' }} />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Recent Activity</span>
        </div>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-7 h-7 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No recent activity</span>
          </div>
        ) : (
          <div className="space-y-0 stagger">
            {recentActivity.map((item, i) => (
              <ActivityItem key={i} icon={item.icon} text={item.text} time={item.time} color={item.color} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
