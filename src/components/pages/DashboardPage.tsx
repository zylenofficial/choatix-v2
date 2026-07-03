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
  Thermometer, Server, Globe, Rocket, ChevronRight,
} from 'lucide-react'
import type { RealtimeStats, RollbackEntry } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

function getUsageColor(pct: number) {
  if (pct >= 80) return { color: '#ffffff', glow: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.06)' }
  if (pct >= 50) return { color: '#cccccc', glow: 'rgba(200,200,200,0.3)', bg: 'rgba(200,200,200,0.04)' }
  return { color: '#999999', glow: 'rgba(150,150,150,0.3)', bg: 'rgba(150,150,150,0.04)' }
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

function GradientRing({ value, size = 120, strokeWidth = 6, colors, label }: {
  value: number; size?: number; strokeWidth?: number; colors: string[]; label: string
}) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  const gradId = `grad-${label}-${Math.random().toString(36).slice(2, 6)}`
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="100%" stopColor={colors[1]} />
            </linearGradient>
          </defs>
          <circle stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
          <circle
            stroke={`url(#${gradId})`} strokeWidth={strokeWidth} fill="transparent" r={radius}
            cx={size / 2} cy={size / 2}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 8px ${colors[1]}50)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-light leading-none" style={{ color: '#fff' }}>{Math.round(value)}</span>
          <span className="text-[8px] mt-1 tracking-[0.15em] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, color }: { icon?: any; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5" style={{ color: color || 'rgba(255,255,255,0.2)' }} />}
        <span className="text-[10px] tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      </div>
      <span className="text-[11px] font-medium" style={{ color: color || 'rgba(255,255,255,0.6)' }}>{value}</span>
    </div>
  )
}

function QuickAction({ icon: Icon, label, desc, gradient, onClick }: {
  icon: any; label: string; desc: string; gradient: string; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all group"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: gradient, border: '1px solid rgba(255,255,255,0.06)' }}>
        <Icon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.7)' }} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</div>
        <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{desc}</div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.15)' }} />
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
  const scoreCol = getScoreColor(score)

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
      addHealthScoreEntry({ score: calcHealthScore(s), timestamp: Date.now() })
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
    setCacheStatus(res?.success ? 'Done' : 'Failed')
    setTimeout(() => setCacheStatus(null), 3000)
  }, [])

  const handleUpdateDrivers = useCallback(async () => {
    await window.electronAPI?.openDriverUpdate()
  }, [])

  const makeChartData = (data: number[], colors: string[]) => ({
    labels: data.map(() => ''),
    datasets: [{
      data,
      borderColor: colors[0],
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart
        const { ctx: c, chartArea } = chart
        if (!chartArea) return 'rgba(255,255,255,0.02)'
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, colors[1])
        gradient.addColorStop(1, 'rgba(255,255,255,0.01)')
        return gradient
      },
      fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
    }],
  })

  const chartOpts = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { min: 0, max: 100, display: false } },
    animation: { duration: 0 },
  }), [])

  if (!stats) {
    return (
      <div className="h-full flex flex-col items-center justify-center page-transition">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 pulse-glow" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Activity className="w-8 h-8 scan-pulse" style={{ color: '#ffffff' }} />
        </div>
        <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading system data</p>
        <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Gathering hardware information</p>
      </div>
    )
  }

  const cpuTemp = stats.cpu.temperature !== null ? `${stats.cpu.temperature}°C` : 'N/A'
  const gpuTemp = stats.gpu.temperature !== null ? `${stats.gpu.temperature}°C` : 'N/A'
  const gpuVram = stats.gpu.vram > 0 ? `${stats.gpu.vram} MB` : 'N/A'
  const cpuU = getUsageColor(stats.cpu.usage)
  const ramU = getUsageColor(stats.ram.percentage)
  const gpuU = getUsageColor(stats.gpu.usage)
  const diskPct = stats.storage.drives[0]?.percentage || 0
  const diskU = getUsageColor(diskPct)

  return (
    <div className="p-6 space-y-5 h-full overflow-y-auto page-transition">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-light tracking-tight" style={{ color: '#fff' }}>Dashboard</h1>
          <p className="text-[9px] mt-1 tracking-wide" style={{ color: 'rgba(255,255,255,0.2)' }}>
            LAST UPDATED {lastUpdate.toLocaleTimeString()} · AUTO-REFRESHING
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="live-dot" />
          <span className="text-[8px] font-bold tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.4)' }}>LIVE</span>
        </div>
      </div>

      {/* Hero: Score + 4 Gauges */}
      <div className="flex gap-4">
        {/* Health Score Hero */}
          <div className="relative rounded-2xl p-6 flex flex-col items-center justify-center min-w-[180px] overflow-hidden stat-card">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 30%, ${scoreCol}12 0%, transparent 60%)` }} />
          <div className="relative" style={{ width: 130, height: 130 }}>
            <svg width={130} height={130} className="transform -rotate-90">
              <defs>
                <linearGradient id="score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={scoreCol} />
                  <stop offset="100%" stopColor={scoreCol + '80'} />
                </linearGradient>
              </defs>
              <circle stroke="rgba(255,255,255,0.04)" strokeWidth={7} fill="transparent" r={54} cx={65} cy={65} />
              <circle
                stroke="url(#score-grad)" strokeWidth={7} fill="transparent" r={54}
                cx={65} cy={65}
                strokeDasharray={54 * 2 * Math.PI}
                strokeDashoffset={54 * 2 * Math.PI * (1 - score / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 16px ${scoreCol}40)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[42px] font-light leading-none" style={{ color: '#fff' }}>{score}</span>
              <span className="text-[8px] mt-1 tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.2)' }}>/ 100</span>
            </div>
          </div>
          <div className="text-[11px] font-medium mt-3 tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>SYSTEM HEALTH</div>
          <div className="text-[9px] mt-0.5 font-medium" style={{ color: scoreCol }}>{getScoreLabel(score).toUpperCase()}</div>
        </div>

        {/* Resource Gauges */}
        <div className="flex-1 grid grid-cols-4 gap-3 stagger">
          {[
            { value: stats.cpu.usage, label: 'CPU', colors: [cpuU.color, cpuU.color + '60'] },
            { value: stats.ram.percentage, label: 'RAM', colors: [ramU.color, ramU.color + '60'] },
            { value: stats.gpu.usage, label: 'GPU', colors: [gpuU.color, gpuU.color + '60'] },
            { value: diskPct, label: 'DISK', colors: [diskU.color, diskU.color + '60'] },
          ].map((g, i) => (
            <div key={i} className="stat-card p-4 flex flex-col items-center transition-all duration-300 hover:border-[rgba(255,255,255,0.10)]">
              <GradientRing value={g.value} colors={g.colors} label={g.label} size={90} strokeWidth={4} />
            </div>
          ))}
        </div>
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-4 gap-3 stagger">
        {/* CPU */}
        <div className="stat-card overflow-hidden transition-all duration-300 hover:border-[rgba(255,255,255,0.10)]">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: cpuU.bg }}>
            <Cpu className="w-3 h-3" style={{ color: cpuU.color }} />
            <span className="text-[9px] tracking-[0.15em] font-semibold" style={{ color: cpuU.color }}>CPU</span>
          </div>
          <div className="p-1">
            <InfoRow icon={Thermometer} label="Temp" value={cpuTemp} color={cpuU.color} />
            <InfoRow icon={Server} label="Cores" value={`${stats.cpu.cores}C / ${stats.cpu.threads}T`} />
            <InfoRow icon={Gauge} label="Clock" value={stats.cpu.clock > 0 ? `${(stats.cpu.clock / 1000).toFixed(1)} GHz` : 'N/A'} />
          </div>
        </div>

        {/* RAM */}
        <div className="stat-card overflow-hidden transition-all duration-300 hover:border-[rgba(255,255,255,0.10)]">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: ramU.bg }}>
            <MemoryStick className="w-3 h-3" style={{ color: ramU.color }} />
            <span className="text-[9px] tracking-[0.15em] font-semibold" style={{ color: ramU.color }}>MEMORY</span>
          </div>
          <div className="p-1">
            <InfoRow label="Used" value={formatBytes(stats.ram.used * 1024 * 1024)} color={ramU.color} />
            <InfoRow label="Total" value={formatBytes(stats.ram.total * 1024 * 1024)} />
            <InfoRow label="Free" value={formatBytes(stats.ram.available * 1024 * 1024)} />
          </div>
        </div>

        {/* GPU */}
        <div className="stat-card overflow-hidden transition-all duration-300 hover:border-[rgba(255,255,255,0.10)]">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: gpuU.bg }}>
            <Monitor className="w-3 h-3" style={{ color: gpuU.color }} />
            <span className="text-[9px] tracking-[0.15em] font-semibold" style={{ color: gpuU.color }}>GPU</span>
          </div>
          <div className="p-1">
            <InfoRow icon={Thermometer} label="Temp" value={gpuTemp} color={gpuU.color} />
            <InfoRow label="VRAM" value={gpuVram} />
            <InfoRow label="Model" value={stats.gpu.model} />
          </div>
        </div>

        {/* Storage */}
        <div className="stat-card overflow-hidden transition-all duration-300 hover:border-[rgba(255,255,255,0.10)]">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: diskU.bg }}>
            <HardDrive className="w-3 h-3" style={{ color: diskU.color }} />
            <span className="text-[9px] tracking-[0.15em] font-semibold" style={{ color: diskU.color }}>STORAGE</span>
          </div>
          <div className="p-1">
            {stats.storage.drives.length > 0 ? (
              <>
                <InfoRow label="Used" value={`${stats.storage.drives[0].usedGB} GB`} color={diskU.color} />
                <InfoRow label="Free" value={`${stats.storage.drives[0].freeGB} GB`} />
                <InfoRow label="Total" value={`${stats.storage.drives[0].totalGB} GB`} />
              </>
            ) : (
              <div className="py-4 text-center">
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>No drives detected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-3 stagger">
        {[
          { data: cpuHistory, label: 'CPU', colors: ['#ffffff', 'rgba(255,255,255,0.12)'] },
          { data: ramHistory, label: 'RAM', colors: ['#cccccc', 'rgba(200,200,200,0.10)'] },
          { data: gpuHistory, label: 'GPU', colors: ['#999999', 'rgba(150,150,150,0.08)'] },
        ].map((chart, i) => (
          <div key={i} className="stat-card p-4 transition-all duration-300 hover:border-[rgba(255,255,255,0.10)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: chart.colors[0], boxShadow: `0 0 8px ${chart.colors[0]}60` }} />
                <span className="text-[9px] tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>{chart.label} USAGE</span>
              </div>
              <span className="text-[13px] font-light" style={{ color: chart.colors[0] }}>{chart.data.length > 0 ? `${Math.round(chart.data[chart.data.length - 1])}%` : '--'}</span>
            </div>
            <div style={{ height: 80 }}><Line data={makeChartData(chart.data, chart.colors)} options={chartOpts} /></div>
          </div>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-3 stagger">
        {/* System */}
        <div className="stat-card overflow-hidden transition-all duration-300 hover:border-[rgba(255,255,255,0.10)]">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Gauge className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>
            <span className="text-[9px] tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>SYSTEM</span>
          </div>
          <div className="p-1">
            <InfoRow icon={Power} label="Power Plan" value={stats.system.powerPlan} />
            <InfoRow icon={Gamepad2} label="Game Mode" value={stats.system.gameMode === true || stats.system.gameMode === "1" ? 'ON' : 'OFF'} color={stats.system.gameMode === true || stats.system.gameMode === "1" ? 'rgba(255,255,255,0.6)' : undefined} />
            <InfoRow icon={Monitor} label="OS" value={stats.system.os} />
            <InfoRow icon={Clock} label="Uptime" value={formatUptime(stats.system.uptime)} />
            <InfoRow icon={Activity} label="Processes" value={`${stats.system.processes}`} />
          </div>
        </div>

        {/* Network */}
        <div className="stat-card overflow-hidden transition-all duration-300 hover:border-[rgba(255,255,255,0.10)]">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Globe className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>
            <span className="text-[9px] tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>NETWORK</span>
          </div>
          <div className="p-1">
            <InfoRow icon={ArrowDown} label="Download" value={formatSpeed(stats.network.downloadSpeed)} color="rgba(255,255,255,0.5)" />
            <InfoRow icon={ArrowUp} label="Upload" value={formatSpeed(stats.network.uploadSpeed)} color="rgba(255,255,255,0.5)" />
            <InfoRow icon={Wifi} label="Adapter" value={stats.network.adapterName} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="stat-card overflow-hidden transition-all duration-300 hover:border-[rgba(255,255,255,0.10)]">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Rocket className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>
            <span className="text-[9px] tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>ACTIONS</span>
          </div>
          <div className="p-2 space-y-1.5">
            <QuickAction icon={Shield} label="Scan System" desc="Detect issues" gradient="rgba(255,255,255,0.04)" onClick={() => window.dispatchEvent(new CustomEvent('choatix-navigate', { detail: 'scan' }))} />
            <QuickAction icon={Zap} label="Optimize All" desc="Apply fixes" gradient="rgba(255,255,255,0.04)" onClick={() => window.dispatchEvent(new CustomEvent('choatix-navigate', { detail: 'optimizer' }))} />
            <QuickAction icon={Trash2} label={cacheStatus || 'Clear Cache'} desc="Remove temp files" gradient="rgba(255,255,255,0.04)" onClick={handleClearCache} />
            <QuickAction icon={Download} label="Update Drivers" desc="Latest GPU drivers" gradient="rgba(255,255,255,0.04)" onClick={handleUpdateDrivers} />
          </div>
        </div>
      </div>
    </div>
  )
}
