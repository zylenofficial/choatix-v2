'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Cpu, Zap, Shield, AlertTriangle, RefreshCw, Loader2, Activity,
  MemoryStick, HardDrive, ArrowDown, ArrowUp, Search, Settings2,
  CheckCircle2, ChevronDown, ChevronRight,
} from 'lucide-react'

interface ProcessInfo {
  name: string; pid: number; ram: number
  status: 'safe' | 'aggressive' | 'critical' | 'running'
}

interface ProcessSummary {
  total: number; safe: number; aggressive: number; critical: number; totalRam: number
}

interface ScanResult { processes: ProcessInfo[]; summary: ProcessSummary }

interface OptimizeResult {
  success: boolean; killed: number; savedRam: number; mode: string
  processes: { name: string; pid: number; ram: number }[]
}

interface GameProcess {
  name: string; pid: number; cpu: number; ram: number; threads: number; affinity: number
}

type Tab = 'processes' | 'affinity'

export function ProcessOptimizerPage() {
  const [tab, setTab] = useState<Tab>('processes')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null)
  const [mode, setMode] = useState<'safe' | 'aggressive'>('safe')
  const [search, setSearch] = useState('')

  // Affinity state
  const [gameProcesses, setGameProcesses] = useState<GameProcess[]>([])
  const [affinityLoading, setAffinityLoading] = useState(false)
  const [cpuCount, setCpuCount] = useState(8)
  const [selectedProcess, setSelectedProcess] = useState<number | null>(null)
  const [settingAffinity, setSettingAffinity] = useState<number | null>(null)

  const handleScan = useCallback(async () => {
    setScanning(true)
    setOptimizeResult(null)
    try {
      const result = await window.electronAPI?.scanProcesses()
      if (result) setScanResult(result)
    } catch (e) { console.error('Scan error:', e) }
    setScanning(false)
  }, [])

  const handleOptimize = useCallback(async () => {
    setOptimizing(true)
    try {
      const result = await window.electronAPI?.optimizeProcesses(mode)
      if (result) {
        setOptimizeResult(result)
        const newScan = await window.electronAPI?.scanProcesses()
        if (newScan) setScanResult(newScan)
      }
    } catch (e) { console.error('Optimize error:', e) }
    setOptimizing(false)
  }, [mode])

  const handleRestore = useCallback(async () => {
    try {
      await window.electronAPI?.restoreProcesses()
      setOptimizeResult(null)
      const newScan = await window.electronAPI?.scanProcesses()
      if (newScan) setScanResult(newScan)
    } catch (e) { console.error('Restore error:', e) }
  }, [])

  const scanGameProcesses = useCallback(async () => {
    setAffinityLoading(true)
    try {
      const result = await (window.electronAPI as any)?.getProcessList?.()
      if (result?.success) {
        setGameProcesses(result.processes)
        setCpuCount(result.cpuCount || 8)
      }
    } catch {}
    setAffinityLoading(false)
  }, [])

  const handleSetAffinity = useCallback(async (pid: number, cores: number[]) => {
    setSettingAffinity(pid)
    try {
      let mask = 0
      for (const c of cores) mask |= (1 << c)
      if (mask === 0) mask = (1 << cpuCount) - 1
      await (window.electronAPI as any)?.setProcessAffinity?.(pid, mask)
      await scanGameProcesses()
    } catch {}
    setSettingAffinity(null)
  }, [cpuCount, scanGameProcesses])

  const setAffinityPreset = useCallback((pid: number, preset: string) => {
    const halfCores = Math.floor(cpuCount / 2)
    switch (preset) {
      case 'all': handleSetAffinity(pid, Array.from({ length: cpuCount }, (_, i) => i)); break
      case 'performance': handleSetAffinity(pid, Array.from({ length: halfCores }, (_, i) => i)); break
      case 'efficiency': handleSetAffinity(pid, Array.from({ length: halfCores }, (_, i) => i + halfCores)); break
      case 'single': handleSetAffinity(pid, [0]); break
    }
  }, [cpuCount, handleSetAffinity])

  useEffect(() => { handleScan() }, [handleScan])
  useEffect(() => { if (tab === 'affinity') scanGameProcesses() }, [tab, scanGameProcesses])

  const filteredProcesses = scanResult?.processes.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  const statusColors = {
    safe: { bg: 'rgba(255,255,255,0.08)', text: '#fff', label: 'Safe to Kill' },
    aggressive: { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.6)', label: 'Aggressive' },
    critical: { bg: 'rgba(255,255,255,0.03)', text: 'rgba(255,255,255,0.3)', label: 'Critical' },
    running: { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.5)', label: 'Running' },
  }

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'processes', label: 'Processes', icon: Cpu },
    { id: 'affinity', label: 'CPU Affinity', icon: Settings2 },
  ]

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
              <Cpu className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Process Optimizer</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Optimize processes, set CPU affinity for games</p>
            </div>
          </div>
          {tab === 'processes' && (
            <button onClick={handleScan} disabled={scanning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Rescan'}
            </button>
          )}
          {tab === 'affinity' && (
            <button onClick={scanGameProcesses} disabled={affinityLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
              <RefreshCw className={`w-3.5 h-3.5 ${affinityLoading ? 'animate-spin' : ''}`} />
              {affinityLoading ? 'Scanning...' : 'Scan Processes'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl fade-in" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200"
                style={{
                  background: active ? '#fff' : 'transparent',
                  color: active ? '#000' : 'var(--text-muted)',
                }}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* ═══ Processes Tab ═══ */}
        {tab === 'processes' && (
          <>
            {/* Stats cards */}
            {scanResult && (
              <div className="grid grid-cols-4 gap-3 fade-in">
                {[
                  { icon: <Cpu className="w-4 h-4" />, label: 'Processes', value: scanResult.summary.total, color: '#fff' },
                  { icon: <Activity className="w-4 h-4" />, label: 'Safe to Kill', value: scanResult.summary.safe, color: '#fff' },
                  { icon: <Zap className="w-4 h-4" />, label: 'Aggressive', value: scanResult.summary.aggressive, color: 'rgba(255,255,255,0.6)' },
                  { icon: <MemoryStick className="w-4 h-4" />, label: 'Total RAM', value: `${scanResult.summary.totalRam} MB`, color: '#fff' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                        {stat.icon}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</div>
                    </div>
                    <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Optimize banner */}
            {optimizeResult && optimizeResult.killed > 0 && (
              <div className="p-4 rounded-2xl flex items-center gap-4 fade-in" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-white">Optimized!</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Killed {optimizeResult.killed} processes &bull; Saved {optimizeResult.savedRam} MB RAM
                  </div>
                </div>
                <button onClick={handleRestore}
                  className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
                  Restore
                </button>
              </div>
            )}

            {/* Mode selector + Search */}
            <div className="flex items-center gap-3 fade-in">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                {([['safe', 'Safe', Shield], ['aggressive', 'Aggressive', AlertTriangle]] as [string, string, any][]).map(([id, label, Icon]) => (
                  <button key={id} onClick={() => setMode(id as any)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold transition-all duration-200"
                    style={{
                      background: mode === id ? '#fff' : 'transparent',
                      color: mode === id ? '#000' : 'var(--text-secondary)',
                    }}>
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search processes..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none transition-all duration-200"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: '#fff' }} />
              </div>

              <button onClick={handleOptimize} disabled={optimizing || !scanResult}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover-lift disabled:opacity-40"
                style={{ background: '#fff', color: '#000', boxShadow: '0 4px 20px rgba(255,255,255,0.15)' }}>
                {optimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {optimizing ? 'Optimizing...' : 'Optimize'}
              </button>
            </div>

            {/* Process list */}
            {scanResult && (
              <div className="rounded-2xl overflow-hidden fade-in" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="col-span-5">Process</div>
                  <div className="col-span-2 text-right">PID</div>
                  <div className="col-span-2 text-right">RAM</div>
                  <div className="col-span-3 text-right">Status</div>
                </div>
                <div className="max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {filteredProcesses.length === 0 && (
                    <div className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">
                      {search ? 'No processes match search' : 'No processes found'}
                    </div>
                  )}
                  {filteredProcesses.map((proc, i) => {
                    const style = statusColors[proc.status]
                    return (
                      <div key={`${proc.pid}-${i}`}
                        className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs items-center transition-colors duration-150 hover:bg-white/[0.02]"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <div className="col-span-5 font-medium text-white truncate">{proc.name}</div>
                        <div className="col-span-2 text-right text-[var(--text-muted)] font-mono text-[10px]">{proc.pid}</div>
                        <div className="col-span-2 text-right text-white font-mono text-[10px]">{proc.ram} MB</div>
                        <div className="col-span-3 flex justify-end">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold"
                            style={{ background: style.bg, color: style.text }}>{style.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="grid grid-cols-3 gap-3 fade-in">
              {[
                { icon: <Search className="w-4 h-4" />, label: 'Scan', desc: 'Detects all background processes' },
                { icon: <Shield className="w-4 h-4" />, label: 'Safe Mode', desc: 'Kills only safe bloatware' },
                { icon: <Zap className="w-4 h-4" />, label: 'Optimize', desc: 'Frees RAM and CPU cycles' },
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
          </>
        )}

        {/* ═══ Affinity Tab ═══ */}
        {tab === 'affinity' && (
          <div className="space-y-4 fade-in">
            {/* CPU Info */}
            <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                  <Cpu className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{cpuCount} Logical Cores Detected</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Assign specific cores to games for better performance
                  </div>
                </div>
              </div>
            </div>

            {/* Process List */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="col-span-4">Process</div>
                <div className="col-span-1 text-right">PID</div>
                <div className="col-span-2 text-right">CPU</div>
                <div className="col-span-1 text-right">RAM</div>
                <div className="col-span-1 text-right">Threads</div>
                <div className="col-span-3 text-right">Action</div>
              </div>
              <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {affinityLoading && (
                  <div className="px-4 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <div className="text-xs text-[var(--text-muted)]">Scanning processes...</div>
                  </div>
                )}
                {!affinityLoading && gameProcesses.length === 0 && (
                  <div className="px-4 py-12 text-center text-xs text-[var(--text-muted)]">
                    No running game processes detected. Launch a game first.
                  </div>
                )}
                {gameProcesses.map(proc => {
                  const isExpanded = selectedProcess === proc.pid
                  const activeCores: number[] = []
                  for (let i = 0; i < cpuCount; i++) {
                    if (proc.affinity & (1 << i)) activeCores.push(i)
                  }
                  return (
                    <div key={proc.pid}>
                      <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs items-center transition-colors duration-150 hover:bg-white/[0.02] cursor-pointer"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onClick={() => setSelectedProcess(isExpanded ? null : proc.pid)}>
                        <div className="col-span-4 font-medium text-white truncate flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                          {proc.name}
                        </div>
                        <div className="col-span-1 text-right text-[var(--text-muted)] font-mono text-[10px]">{proc.pid}</div>
                        <div className="col-span-2 text-right text-white font-mono text-[10px]">{proc.cpu}%</div>
                        <div className="col-span-1 text-right text-white font-mono text-[10px]">{proc.ram}MB</div>
                        <div className="col-span-1 text-right text-white font-mono text-[10px]">{proc.threads}</div>
                        <div className="col-span-3 flex justify-end">
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                            {activeCores.length}/{cpuCount} cores
                          </span>
                        </div>
                      </div>

                      {/* Expanded Affinity Panel */}
                      {isExpanded && (
                        <div className="px-4 py-4" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                          {/* Preset Buttons */}
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-[9px] uppercase tracking-wider font-bold mr-2" style={{ color: 'var(--text-muted)' }}>Presets:</span>
                            {[
                              { id: 'all', label: 'All Cores', desc: `${cpuCount} cores` },
                              { id: 'performance', label: 'Performance', desc: `0-${Math.floor(cpuCount / 2) - 1}` },
                              { id: 'efficiency', label: 'Efficiency', desc: `${Math.floor(cpuCount / 2)}-${cpuCount - 1}` },
                              { id: 'single', label: 'Core 0 Only', desc: 'Best single-thread' },
                            ].map(preset => (
                              <button key={preset.id} onClick={() => setAffinityPreset(proc.pid, preset.id)}
                                disabled={settingAffinity === proc.pid}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                <div>{preset.label}</div>
                                <div className="text-[8px] text-[var(--text-muted)]">{preset.desc}</div>
                              </button>
                            ))}
                          </div>

                          {/* Core Grid */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>Cores:</span>
                            <div className="flex gap-1.5 flex-wrap">
                              {Array.from({ length: cpuCount }, (_, i) => {
                                const isActive = activeCores.includes(i)
                                const isPinned = i < cpuCount / 2
                                return (
                                  <div key={i}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-200 cursor-pointer"
                                    style={{
                                      background: isActive ? (isPinned ? 'rgba(74,222,128,0.2)' : 'rgba(96,165,250,0.2)') : 'rgba(255,255,255,0.03)',
                                      border: isActive ? (isPinned ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(96,165,250,0.4)') : '1px solid var(--border-subtle)',
                                      color: isActive ? '#fff' : 'var(--text-muted)',
                                    }}>
                                    {i}
                                  </div>
                                )
                              })}
                            </div>
                            {settingAffinity === proc.pid && (
                              <Loader2 className="w-4 h-4 animate-spin ml-2" style={{ color: 'var(--text-muted)' }} />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3 fade-in">
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.15)' }}>
                    <Cpu className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                  </div>
                  <span className="text-[10px] font-bold text-white">Performance Cores</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Cores 0-{Math.floor(cpuCount / 2) - 1} are typically performance cores. Assign your main game to these for maximum single-thread performance.
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.15)' }}>
                    <Settings2 className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
                  </div>
                  <span className="text-[10px] font-bold text-white">Efficiency Cores</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Cores {Math.floor(cpuCount / 2)}-{cpuCount - 1} are efficiency cores. Use these for background tasks and secondary processes.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
