'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { Cpu, MemoryStick, Monitor, HardDrive, Wifi, Gauge, Zap, TrendingUp, Activity, Gamepad2 } from 'lucide-react'
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
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6 fade-in">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
            <Activity className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Performance</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Real-time system metrics</p>
          </div>
        </div>

        {/* Resource Gauges */}
        <div className="grid grid-cols-4 gap-3 stagger">
          {[
            { icon: Cpu, label: 'CPU', value: `${cpuUsage.toFixed(0)}%`, pct: cpuUsage, sub: info?.cpu?.model?.split(' ').slice(0, 3).join(' ') || 'Unknown', detail: `${info?.cpu?.cores ?? 0}C / ${info?.cpu?.threads ?? 0}T` },
            { icon: MemoryStick, label: 'RAM', value: `${ramPct}%`, pct: ramPct, sub: `${(ramUsed / 1024).toFixed(1)} / ${(ramTotal / 1024).toFixed(1)} GB`, detail: 'Physical memory' },
            { icon: HardDrive, label: 'Disk', value: `${diskPct}%`, pct: diskPct, sub: `${(diskUsed / 1024).toFixed(0)} / ${(diskTotal / 1024).toFixed(0)} GB`, detail: 'Storage space' },
            { icon: Wifi, label: 'Ping', value: info?.network?.latencyMs != null ? `${info.network.latencyMs}ms` : 'N/A', pct: info?.network?.latencyMs ? Math.min(100, info.network.latencyMs / 2) : 0, sub: info?.network?.adapterName || 'Unknown', detail: 'Network latency' },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                  <item.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-medium">{item.label}</span>
              </div>
              <div className="text-2xl font-black text-white mb-0.5">{item.value}</div>
              <div className="text-[10px] text-[var(--text-tertiary)] truncate mb-3">{item.sub}</div>
              <div className="h-1.5 rounded-full mb-1.5" style={{ background: 'var(--bg-elevated)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{
                  width: `${item.pct}%`,
                  background: item.pct > 80 ? '#999' : item.pct > 50 ? '#ccc' : '#fff',
                }} />
              </div>
              <div className="text-[9px] text-[var(--text-muted)]">{item.detail}</div>
            </div>
          ))}
        </div>

        {/* Gaming Targets */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-white">Gaming Optimization Targets</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Background Processes', value: `${bgProcs}`, pct: Math.min(100, (bgProcs / 150) * 100), desc: 'Processes without windows' },
              { label: 'Startup Programs', value: `${startupCount}`, pct: Math.min(100, (startupCount / 20) * 100), desc: 'Launch at boot' },
              { label: 'Power Plan', value: info?.powerPlan || 'Unknown', pct: info?.powerPlan?.toLowerCase().includes('high') ? 10 : 80, desc: 'CPU power management' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-white">{item.label}</span>
                  <span className="text-xs font-bold text-white">{item.value}</span>
                </div>
                <div className="h-1.5 rounded-full mb-1.5" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width: `${item.pct}%`,
                    background: item.pct > 60 ? '#999' : '#fff',
                  }} />
                </div>
                <div className="text-[9px] text-[var(--text-muted)]">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* GPU + FPS */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                <Monitor className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-white">GPU</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Model', value: info?.gpu?.model || 'Unknown' },
                { label: 'Vendor', value: info?.gpu?.vendor && info.gpu.vendor !== 'unknown' ? info.gpu.vendor.toUpperCase() : 'Unknown' },
                { label: 'VRAM', value: info?.gpu?.vram ? `${info.gpu.vram} MB` : 'Unknown' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-tertiary)]">{row.label}</span>
                  <span className="text-[11px] font-medium text-white truncate ml-4">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-white">FPS Optimization</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Game Mode', value: info?.gameMode === true || info?.gameMode === "1" ? 'Enabled' : info?.gameMode === false || info?.gameMode === "0" ? 'Disabled' : 'Unknown' },
                { label: 'Mouse Accel', value: info?.mouse?.enhancePointerPrecision ? 'ON (bad)' : 'OFF (good)' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-tertiary)]">{row.label}</span>
                  <span className="text-[11px] font-medium text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Process Optimizer */}
        <ProcessOptimizer />
      </div>
    </div>
  )
}
