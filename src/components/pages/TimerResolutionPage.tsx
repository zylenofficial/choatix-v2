'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Timer, Zap, RefreshCw, Loader2, CheckCircle2, AlertTriangle,
  Clock, Settings2, Shield, ArrowRight,
} from 'lucide-react'

interface TimerState {
  globalTimer: boolean
  quantum: string
  dynamicTick: string
  platformClock: string
}

export function TimerResolutionPage() {
  const [timerState, setTimerState] = useState<TimerState | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; mode: string } | null>(null)

  const scanTimer = useCallback(async () => {
    setLoading(true)
    try {
      const result = await (window.electronAPI as any)?.getTimerResolution?.()
      if (result?.success) {
        setTimerState({
          globalTimer: result.globalTimer,
          quantum: result.quantum,
          dynamicTick: result.dynamicTick,
          platformClock: result.platformClock,
        })
      }
    } catch {}
    setLoading(false)
  }, [])

  const applyOptimal = useCallback(async () => {
    setApplying(true)
    setLastResult(null)
    try {
      const result = await (window.electronAPI as any)?.setTimerResolution?.('optimal')
      if (result?.success) {
        setLastResult({ success: true, mode: 'optimal' })
        await scanTimer()
      }
    } catch {}
    setApplying(false)
  }, [scanTimer])

  const resetTimer = useCallback(async () => {
    setResetting(true)
    setLastResult(null)
    try {
      const result = await (window.electronAPI as any)?.setTimerResolution?.('reset')
      if (result?.success) {
        setLastResult({ success: true, mode: 'reset' })
        await scanTimer()
      }
    } catch {}
    setResetting(false)
  }, [scanTimer])

  useEffect(() => { scanTimer() }, [scanTimer])

  const isOptimal = timerState?.globalTimer && timerState?.dynamicTick?.includes('yes') && timerState?.platformClock?.includes('true')

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-3xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#fff' }}>
              <Timer className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Timer Resolution</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Reduce system timer latency for lower input lag</p>
            </div>
          </div>
          <button onClick={scanTimer} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Scanning...' : 'Rescan'}
          </button>
        </div>

        {/* Status Card */}
        <div className="rounded-2xl p-6 glass fade-in" style={{ border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <Clock className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>Current Status</span>
          </div>

          {timerState ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ background: timerState.globalTimer ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)' }}>
                      {timerState.globalTimer
                        ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                        : <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f87171' }} />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Timer Requests</span>
                  </div>
                  <div className="text-lg font-bold" style={{ color: timerState.globalTimer ? '#4ade80' : '#f87171' }}>
                    {timerState.globalTimer ? 'Enabled' : 'Disabled'}
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ background: timerState.dynamicTick?.includes('yes') ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)' }}>
                      {timerState.dynamicTick?.includes('yes')
                        ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                        : <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Dynamic Tick</span>
                  </div>
                  <div className="text-lg font-bold" style={{ color: timerState.dynamicTick?.includes('yes') ? '#4ade80' : '#fbbf24' }}>
                    {timerState.dynamicTick?.includes('yes') ? 'Disabled' : 'Enabled'}
                  </div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">Should be disabled for gaming</div>
                </div>

                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ background: timerState.platformClock?.includes('true') ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)' }}>
                      {timerState.platformClock?.includes('true')
                        ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                        : <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Platform Clock</span>
                  </div>
                  <div className="text-lg font-bold" style={{ color: timerState.platformClock?.includes('true') ? '#4ade80' : '#fbbf24' }}>
                    {timerState.platformClock?.includes('true') ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">Uses HPET for consistent timing</div>
                </div>

                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ background: isOptimal ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)' }}>
                      {isOptimal
                        ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                        : <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Overall</span>
                  </div>
                  <div className="text-lg font-bold" style={{ color: isOptimal ? '#4ade80' : '#fbbf24' }}>
                    {isOptimal ? 'Optimal' : 'Needs Fix'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[var(--text-muted)]">
              {loading ? 'Scanning timer resolution...' : 'Click Rescan to check status'}
            </div>
          )}
        </div>

        {/* What is Timer Resolution */}
        <div className="rounded-2xl p-5 glass fade-in" style={{ border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <Shield className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>What is Timer Resolution?</span>
          </div>
          <div className="space-y-2 text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            <p>Windows uses a system timer that fires at a default interval (typically 15.6ms). This means your mouse, keyboard, and game inputs are only checked ~64 times per second.</p>
            <p>By setting the timer resolution to its minimum (~0.5ms), inputs are checked up to <span className="text-white font-bold">2000 times per second</span>, dramatically reducing input lag.</p>
            <p className="text-[10px] mt-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-white font-bold">Pro tip:</span> This is one of the most impactful single tweaks for competitive gaming. Most pro players use 0.5ms timer resolution.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 fade-in">
          <button onClick={applyOptimal} disabled={applying || isOptimal}
            className="p-5 rounded-2xl text-left transition-all duration-200 hover-lift disabled:opacity-40"
            style={{
              background: isOptimal ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
              border: isOptimal ? '1px solid var(--border-subtle)' : '1px solid rgba(255,255,255,0.12)',
            }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: isOptimal ? 'rgba(255,255,255,0.05)' : 'rgba(74,222,128,0.1)' }}>
                {applying ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#4ade80' }} />
                  : <Zap className="w-5 h-5" style={{ color: isOptimal ? 'var(--text-muted)' : '#4ade80' }} />}
              </div>
              <div>
                <div className="text-sm font-bold text-white">Apply Optimal</div>
                <div className="text-[10px] text-[var(--text-muted)]">0.5ms resolution + fixes</div>
              </div>
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)]">
              Sets GlobalTimerResolutionRequests, disables Dynamic Tick, enables Platform Clock
            </div>
          </button>

          <button onClick={resetTimer} disabled={resetting}
            className="p-5 rounded-2xl text-left transition-all duration-200 hover-lift disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(248,113,113,0.1)' }}>
                {resetting ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#f87171' }} />
                  : <RefreshCw className="w-5 h-5" style={{ color: '#f87171' }} />}
              </div>
              <div>
                <div className="text-sm font-bold text-white">Reset to Default</div>
                <div className="text-[10px] text-[var(--text-muted)]">Restore Windows defaults</div>
              </div>
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)]">
              Reverts all timer changes back to Windows default settings
            </div>
          </button>
        </div>

        {/* Result Toast */}
        {lastResult && (
          <div className="p-4 rounded-xl flex items-center gap-3 fade-in"
            style={{
              background: lastResult.success ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${lastResult.success ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
            }}>
            {lastResult.success
              ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#4ade80' }} />
              : <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#f87171' }} />}
            <div>
              <div className="text-xs font-bold text-white">
                {lastResult.success ? (lastResult.mode === 'optimal' ? 'Timer optimized!' : 'Timer reset!') : 'Failed'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {lastResult.success
                  ? (lastResult.mode === 'optimal' ? 'Restart your games to see the effect' : 'Default timer settings restored')
                  : 'An error occurred while applying changes'}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
