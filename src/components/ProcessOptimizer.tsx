'use client'

import { useState, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { canAccess } from '@/lib/featureAccess'
import type { ProcessInfo, ProcessSummary } from '@/types'
import {
  Shield, Zap, AlertTriangle, CheckCircle,
  Activity, MemoryStick, RotateCcw, Lock,
  ChevronDown, ChevronUp, Settings, Play,
} from 'lucide-react'

export function ProcessOptimizer() {
  const { license } = useStore()
  const hasAccess = canAccess('optimizer_processes', license.tier)

  const [mode, setMode] = useState<'safe' | 'aggressive'>('safe')
  const [scanning, setScanning] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [result, setResult] = useState<{ processes: ProcessInfo[]; summary: ProcessSummary } | null>(null)
  const [optimizeResult, setOptimizeResult] = useState<{ killed: number; savedRam: number; mode: string } | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [showProcesses, setShowProcesses] = useState(false)
  const [status, setStatus] = useState<'idle' | 'scanning' | 'optimized' | 'error'>('idle')

  const handleScan = useCallback(async () => {
    setScanning(true)
    setStatus('scanning')
    setOptimizeResult(null)
    try {
      const data = await window.electronAPI?.scanProcesses()
      if (data) {
        setResult(data)
        setStatus('idle')
      }
    } catch {
      setStatus('error')
    }
    setScanning(false)
  }, [])

  const handleOptimize = useCallback(async () => {
    setOptimizing(true)
    setShowWarning(false)
    try {
      const data = await window.electronAPI?.optimizeProcesses(mode)
      if (data && data.success) {
        setOptimizeResult({ killed: data.killed, savedRam: data.savedRam, mode: data.mode })
        setStatus('optimized')
        // Re-scan to show updated state
        const updated = await window.electronAPI?.scanProcesses()
        if (updated) setResult(updated)
      }
    } catch {
      setStatus('error')
    }
    setOptimizing(false)
  }, [mode])

  const handleRestore = useCallback(async () => {
    try {
      await window.electronAPI?.restoreProcesses()
      setOptimizeResult(null)
      setStatus('idle')
      handleScan()
    } catch {}
  }, [handleScan])

  if (!hasAccess) {
    return (
      <div className="card-widget p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>Process Optimizer</span>
        </div>
        <p className="text-[11px] mb-3" style={{ color: 'var(--text-tertiary)' }}>Optimize background processes and reduce system load for better performance.</p>
        <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg-tertiary)' }}>
          <Shield className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Requires <span className="font-bold" style={{ color: 'var(--accent)' }}>PRO</span> plan or higher</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card-widget p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: 'var(--warning)' }} />
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>Process Optimizer</span>
        </div>
        {status === 'optimized' && (
          <button onClick={handleRestore} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:opacity-90" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            <RotateCcw className="w-3 h-3" />
            Restore
          </button>
        )}
      </div>

      <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Optimize background processes and reduce system load for better performance.</p>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('safe')}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-semibold transition-all"
          style={{
            background: mode === 'safe' ? 'var(--success)' : 'var(--bg-tertiary)',
            color: mode === 'safe' ? 'white' : 'var(--text-secondary)',
          }}
        >
          <Shield className="w-3.5 h-3.5" />
          Safe Mode
        </button>
        <button
          onClick={() => setMode('aggressive')}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-semibold transition-all"
          style={{
            background: mode === 'aggressive' ? 'var(--danger)' : 'var(--bg-tertiary)',
            color: mode === 'aggressive' ? 'white' : 'var(--text-secondary)',
          }}
        >
          <Zap className="w-3.5 h-3.5" />
          Aggressive Mode
        </button>
      </div>

      <div className="text-[9px] text-center" style={{ color: 'var(--text-muted)' }}>
        {mode === 'safe' ? 'Recommended — disables only bloatware and optional apps' : 'Advanced — disables more background services (may affect some apps)'}
      </div>

      {/* Scan Button */}
      {!result && (
        <button
          onClick={handleScan}
          disabled={scanning}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[12px] font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          <Activity className="w-4 h-4" />
          {scanning ? 'Scanning processes...' : 'Scan Running Processes'}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Before/After Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Processes" value={`${result.summary.total}`} sub="Running" color="var(--text-secondary)" />
            <StatBox label="Safe to Stop" value={`${result.summary.safe}`} sub="Bloatware" color="var(--success)" />
            <StatBox label="Total RAM" value={`${result.summary.totalRam} MB`} sub="Background" color="var(--text-secondary)" />
          </div>

          {optimizeResult && (
            <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                <span className="text-[11px] font-semibold" style={{ color: 'var(--success)' }}>Optimization Complete</span>
              </div>
              <div className="flex gap-4 mt-1">
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{optimizeResult.killed} processes stopped</span>
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{Math.round(optimizeResult.savedRam)} MB freed</span>
              </div>
            </div>
          )}

          {/* Process List Toggle */}
          <button
            onClick={() => setShowProcesses(!showProcesses)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-[10px]"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>{showProcesses ? 'Hide' : 'Show'} process details</span>
            {showProcesses ? <ChevronUp className="w-3 h-3" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />}
          </button>

          {showProcesses && (
            <div className="max-h-60 overflow-y-auto space-y-1 rounded-lg p-2" style={{ background: 'var(--bg-tertiary)' }}>
              {result.processes.slice(0, 30).map((p) => (
                <div key={`${p.name}-${p.pid}`} className="flex items-center justify-between px-2 py-1 rounded" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.status === 'critical' ? 'var(--danger)' : p.status === 'safe' ? 'var(--success)' : p.status === 'aggressive' ? 'var(--warning)' : 'var(--text-muted)' }} />
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>PID {p.pid}</span>
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{p.ram} MB</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded" style={{
                      background: p.status === 'critical' ? 'rgba(255,255,255,0.12)' : p.status === 'safe' ? 'rgba(255,255,255,0.08)' : p.status === 'aggressive' ? 'rgba(255,255,255,0.05)' : 'var(--bg-tertiary)',
                      color: p.status === 'critical' ? 'var(--danger)' : p.status === 'safe' ? 'var(--success)' : p.status === 'aggressive' ? 'var(--warning)' : 'var(--text-muted)',
                    }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Optimize Button */}
          {status !== 'optimized' && (
            <button
              onClick={() => setShowWarning(true)}
              disabled={optimizing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[12px] font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: mode === 'safe' ? 'var(--success)' : 'var(--danger)', color: '#000' }}
            >
              <Play className="w-4 h-4" />
              {optimizing ? 'Optimizing...' : `Optimize (${mode === 'safe' ? 'Safe' : 'Aggressive'})`}
            </button>
          )}

          {/* Re-scan */}
          <button
            onClick={handleScan}
            disabled={scanning}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          >
            <Settings className="w-3 h-3" />
            {scanning ? 'Scanning...' : 'Re-scan'}
          </button>
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--warning)' }} />
              </div>
              <div>
                <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Confirm Optimization</h3>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{mode === 'safe' ? 'Safe Mode' : 'Aggressive Mode'}</p>
              </div>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {mode === 'safe'
                ? 'This will stop non-essential background apps and bloatware. System-critical processes are never touched. You can restore changes anytime.'
                : 'This will stop background services and non-essential processes aggressively. Some apps may need to be restarted. You can restore changes anytime.'}
            </p>
            <div className="p-2 rounded-lg text-[9px]" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
              {result?.summary.safe || 0} processes will be stopped, ~{result?.processes.filter(p => p.status === 'safe').reduce((s, p) => s + p.ram, 0) || 0} MB RAM freed
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleOptimize}
                disabled={optimizing}
                className="flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: mode === 'safe' ? 'var(--success)' : 'var(--danger)', color: '#000' }}
              >
                {optimizing ? 'Working...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="text-[14px] font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}
