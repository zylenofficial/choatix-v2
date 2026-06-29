'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { Cpu, MemoryStick, Monitor, HardDrive, Wifi, Gauge, Zap, TrendingUp } from 'lucide-react'
import { ProcessOptimizer } from '@/components/ProcessOptimizer'
import type { RealtimeStats } from '@/types'

export function PerformancePage() {
  const { advisorResult, lastScan } = useStore()
  const [stats, setStats] = useState<RealtimeStats | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const s = await window.electronAPI?.getRealtimeStats()
      if (s) setStats(s)
    } catch {}
  }, [])

  useEffect(() => {
    fetchStats()
    const id = setInterval(fetchStats, 10000)
    return () => clearInterval(id)
  }, [fetchStats])

  const scanInfo = advisorResult?.systemInfo || lastScan?.systemInfo
  const info = stats ? {
    cpu: { model: stats.cpu.model, usage: stats.cpu.usage, cores: stats.cpu.cores, threads: stats.cpu.threads },
    ram: { total: stats.ram.total, used: stats.ram.used },
    disk: { total: stats.storage.drives.reduce((a, d) => a + d.totalGB, 0) * 1024, used: stats.storage.drives.reduce((a, d) => a + d.usedGB, 0) * 1024 },
    gpu: { model: stats.gpu.model, vendor: stats.gpu.vendor, vram: stats.gpu.vram },
    network: { latencyMs: stats.network.latencyMs ?? scanInfo?.network?.latencyMs ?? null, adapterName: stats.network.adapterName },
    processes: { background: scanInfo?.processes?.background ?? 0 },
    startup: { count: scanInfo?.startup?.count ?? 0 },
    powerPlan: stats.system.powerPlan,
    gameMode: stats.system.gameMode,
    mouse: scanInfo?.mouse ?? { enhancePointerPrecision: false, pollingRateDetected: false },
  } : scanInfo

  const cpuUsage = info?.cpu?.usage ?? 0
  const ramTotal = info?.ram?.total ?? 1
  const ramUsed = info?.ram?.used ?? 0
  const ramPct = ramTotal > 0 ? Math.round((ramUsed / ramTotal) * 100) : 0
  const diskTotal = info?.disk?.total ?? 1
  const diskUsed = info?.disk?.used ?? 0
  const diskPct = diskTotal > 0 ? Math.round((diskUsed / diskTotal) * 100) : 0
  const bgProcs = info?.processes?.background ?? 0
  const startupCount = info?.startup?.count ?? 0

  return (
    <div className="p-5 lg:p-6 space-y-6 fade-in overflow-y-auto h-full">
      <div>
        <h1 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Performance</h1>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Real-time system metrics and optimization targets</p>
      </div>

      {/* Resource gauges */}
      <div className="grid grid-cols-4 gap-3 stagger">
        <GaugeCard icon={Cpu} label="CPU Usage" value={`${cpuUsage.toFixed(0)}%`} pct={cpuUsage} color={cpuUsage > 80 ? 'var(--danger)' : cpuUsage > 50 ? 'var(--warning)' : 'var(--success)'} sub={info?.cpu?.model?.split(' ').slice(0, 3).join(' ') || 'Not detected'} detail={`${info?.cpu?.cores ?? 0} cores / ${info?.cpu?.threads ?? 0} threads`} />
        <GaugeCard icon={MemoryStick} label="Memory" value={`${ramPct}%`} pct={ramPct} color={ramPct > 85 ? 'var(--danger)' : ramPct > 60 ? 'var(--warning)' : 'var(--success)'} sub={`${(ramUsed / 1024).toFixed(1)} / ${(ramTotal / 1024).toFixed(1)} GB`} detail="Physical RAM" />
        <GaugeCard icon={HardDrive} label="Storage" value={`${diskPct}%`} pct={diskPct} color={diskPct > 85 ? 'var(--danger)' : diskPct > 60 ? 'var(--warning)' : 'var(--success)'} sub={`${(diskUsed / 1024).toFixed(0)} / ${(diskTotal / 1024).toFixed(0)} GB`} detail="Disk space" />
        <GaugeCard icon={Wifi} label="Network" value={info?.network?.latencyMs != null ? `${info.network.latencyMs}ms` : 'N/A'} pct={info?.network?.latencyMs ? Math.min(100, info.network.latencyMs / 2) : 0} color={info?.network?.latencyMs && info.network.latencyMs > 80 ? 'var(--danger)' : 'var(--success)'} sub={info?.network?.adapterName || 'Not detected'} detail="Ping to 8.8.8.8" />
      </div>

      {/* Gaming optimization targets */}
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
          </div>
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>Gaming Optimization Targets</span>
        </div>
        <div className="grid grid-cols-3 gap-3 stagger">
          <OptTarget label="Background Processes" value={`${bgProcs}`} max={150} current={bgProcs} color={bgProcs > 80 ? 'var(--danger)' : 'var(--success)'} desc="Processes without windows" />
          <OptTarget label="Startup Programs" value={`${startupCount}`} max={20} current={startupCount} color={startupCount > 8 ? 'var(--danger)' : 'var(--success)'} desc="Launch at boot" />
          <OptTarget label="Power Plan" value={info?.powerPlan || 'Not detected'} current={info?.powerPlan?.toLowerCase().includes('high') ? 0 : 100} max={100} color={info?.powerPlan?.toLowerCase().includes('high') ? 'var(--success)' : 'var(--warning)'} desc="CPU power management" />
        </div>
      </div>

      {/* GPU + FPS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-widget p-5 card-glow">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <Monitor className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>GPU</span>
          </div>
          <div className="space-y-3">
            <Row label="Model" value={info?.gpu?.model || 'Not detected'} />
            <Row label="Vendor" value={info?.gpu?.vendor && info.gpu.vendor !== 'unknown' ? info.gpu.vendor.toUpperCase() : 'Not detected'} />
            <Row label="VRAM" value={info?.gpu?.vram ? `${info.gpu.vram} MB` : 'Not detected'} />
          </div>
        </div>
        <div className="card-widget p-5 card-glow">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>FPS Optimization</span>
          </div>
          <div className="space-y-3">
            <Row label="Game Mode" value={info?.gameMode === true || info?.gameMode === "1" ? 'Enabled' : info?.gameMode === false || info?.gameMode === "0" ? 'Disabled' : 'Not detected'} />
            <Row label="Mouse Acceleration" value={info?.mouse?.enhancePointerPrecision ? 'ON (bad)' : 'OFF (good)'} />
          </div>
        </div>
      </div>

      {/* Process Optimizer */}
      <ProcessOptimizer />
    </div>
  )
}

function GaugeCard({ icon: Icon, label, value, pct, color, sub, detail }: { icon: any; label: string; value: string; pct: number; color: string; sub: string; detail: string }) {
  return (
    <div className="card-widget p-4 card-glow">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div className="text-2xl font-bold mb-0.5 count-animate" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-[10px] mb-3 truncate" style={{ color: 'var(--text-tertiary)' }}>{sub}</div>
      <div className="progress-bar progress-bar-glow mb-1" style={{ '--bar-color': color } as any}>
        <div className="fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{detail}</div>
    </div>
  )
}

function OptTarget({ label, value, max, current, color, desc }: { label: string; value: string; max: number; current: number; color: string; desc: string }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0
  return (
    <div className="card-widget p-4 card-glow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</span>
        <span className="text-[12px] font-bold count-animate" style={{ color }}>{value}</span>
      </div>
      <div className="progress-bar progress-bar-glow mb-1" style={{ '--bar-color': color } as any}>
        <div className="fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{desc}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  )
}
