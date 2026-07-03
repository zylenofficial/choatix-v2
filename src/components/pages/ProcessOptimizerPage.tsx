'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Cpu, Zap, Shield, AlertTriangle, RefreshCw, Loader2, Activity,
  MemoryStick, HardDrive, ArrowDown, ArrowUp, Search,
} from 'lucide-react'

interface ProcessInfo {
  name: string
  pid: number
  ram: number
  status: 'safe' | 'aggressive' | 'critical' | 'running'
}

interface ProcessSummary {
  total: number
  safe: number
  aggressive: number
  critical: number
  totalRam: number
}

interface ScanResult {
  processes: ProcessInfo[]
  summary: ProcessSummary
}

interface OptimizeResult {
  success: boolean
  killed: number
  savedRam: number
  mode: string
  processes: { name: string; pid: number; ram: number }[]
}

export function ProcessOptimizerPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null)
  const [mode, setMode] = useState<'safe' | 'aggressive'>('safe')
  const [search, setSearch] = useState('')

  const handleScan = useCallback(async () => {
    setScanning(true)
    setOptimizeResult(null)
    try {
      const result = await window.electronAPI?.scanProcesses()
      if (result) setScanResult(result)
    } catch (e) {
      console.error('Scan error:', e)
    }
    setScanning(false)
  }, [])

  const handleOptimize = useCallback(async () => {
    setOptimizing(true)
    try {
      const result = await window.electronAPI?.optimizeProcesses(mode)
      if (result) {
        setOptimizeResult(result)
        // Re-scan to show updated state
        const newScan = await window.electronAPI?.scanProcesses()
        if (newScan) setScanResult(newScan)
      }
    } catch (e) {
      console.error('Optimize error:', e)
    }
    setOptimizing(false)
  }, [mode])

  const handleRestore = useCallback(async () => {
    try {
      await window.electronAPI?.restoreProcesses()
      setOptimizeResult(null)
      const newScan = await window.electronAPI?.scanProcesses()
      if (newScan) setScanResult(newScan)
    } catch (e) {
      console.error('Restore error:', e)
    }
  }, [])

  useEffect(() => {
    handleScan()
  }, [handleScan])

  const filteredProcesses = scanResult?.processes.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  const statusColors = {
    safe: { bg: 'rgba(255,255,255,0.08)', text: '#fff', label: 'Safe to Kill' },
    aggressive: { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.6)', label: 'Aggressive' },
    critical: { bg: 'rgba(255,255,255,0.03)', text: 'rgba(255,255,255,0.3)', label: 'Critical' },
    running: { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.5)', label: 'Running' },
  }

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
                <Cpu className="w-6 h-6 text-black" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Process Optimizer</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Reduce background processes, threads, and handles</p>
            </div>
          </div>
          <button onClick={handleScan} disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Rescan'}
          </button>
        </div>

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
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search processes..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none transition-all duration-200"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
              }}
            />
          </div>

          <button onClick={handleOptimize} disabled={optimizing || !scanResult}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover-lift disabled:opacity-40"
            style={{ background: '#fff', color: '#000', boxShadow: '0 4px 20px rgba(255,255,255,0.15)' }}>
            {optimizing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            {optimizing ? 'Optimizing...' : 'Optimize'}
          </button>
        </div>

        {/* Process list */}
        {scanResult && (
          <div className="rounded-2xl overflow-hidden fade-in" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="col-span-5">Process</div>
              <div className="col-span-2 text-right">PID</div>
              <div className="col-span-2 text-right">RAM</div>
              <div className="col-span-3 text-right">Status</div>
            </div>

            {/* Rows */}
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
                        style={{ background: style.bg, color: style.text }}>
                        {style.label}
                      </span>
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
      </div>
    </div>
  )
}
