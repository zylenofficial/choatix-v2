'use client'

import { useState, useCallback, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { performAdvisorScan, getScanSteps, applyAdvisorFix } from '@/lib/advisor'
import { canAccessTier } from '@/lib/featureAccess'
import { AdvisorIssue } from '@/types'
import { Scan, CheckCircle2, Cpu, HardDrive, Wifi, MemoryStick, Gauge, Monitor, Shield, Zap, Loader2, ShieldAlert, RefreshCw, Lock, ArrowRight } from 'lucide-react'

const PHASE_ICONS: Record<string, any> = { cpu: Cpu, ram: MemoryStick, disk: HardDrive, gpu: Monitor, network: Wifi, startup: Zap, power: Gauge, analysis: Scan }

export function ScanPage() {
  const { license, advisorResult, setAdvisorResult, advisorScanStatus, setAdvisorScanStatus, advisorDismissedIssues, dismissAdvisorIssue } = useStore()
  const [scanStep, setScanStep] = useState(0)
  const [fixingIssue, setFixingIssue] = useState<string | null>(null)
  const [appliedIssues, setAppliedIssues] = useState<Set<string>>(new Set())
  const [optimizingAll, setOptimizingAll] = useState(false)
  const [optimizeResult, setOptimizeResult] = useState<{ applied: number; total: number } | null>(null)
  const scanSteps = useRef(getScanSteps())

  const visibleIssues = advisorResult
    ? advisorResult.issues.filter(i => !advisorDismissedIssues.includes(i.id))
    : []

  const handleScan = useCallback(async () => {
    setAdvisorScanStatus('scanning')
    setScanStep(0)
    setAppliedIssues(new Set())
    const steps = scanSteps.current
    for (let i = 0; i < steps.length; i++) {
      setScanStep(i)
      await new Promise(r => setTimeout(r, 280 + Math.random() * 200))
    }
    const { result } = await performAdvisorScan(license.tier)
    if (result) setAdvisorResult(result)
    setAdvisorScanStatus('complete')
  }, [license.tier, setAdvisorResult, setAdvisorScanStatus])

  const handleFix = useCallback(async (issue: AdvisorIssue) => {
    if (!issue.tweakId) return
    if (!canAccessTier(license.tier, issue.requiredTier)) return
    setFixingIssue(issue.id)
    try {
      const result = await applyAdvisorFix(issue.tweakId)
      if (result.success) setAppliedIssues(prev => new Set(prev).add(issue.id))
    } catch {}
    setFixingIssue(null)
  }, [license.tier])

  const handleDismiss = useCallback((id: string) => dismissAdvisorIssue(id), [dismissAdvisorIssue])

  const handleOneClickOptimize = useCallback(async () => {
    if (!window.electronAPI) return
    setOptimizingAll(true)
    setOptimizeResult(null)
    const res = await window.electronAPI.oneClickOptimize()
    setOptimizingAll(false)
    if (res.success) setOptimizeResult({ applied: res.applied, total: res.total })
    visibleIssues.forEach(issue => {
      if (canAccessTier(license.tier, issue.requiredTier)) setAppliedIssues(prev => new Set(prev).add(issue.id))
    })
  }, [visibleIssues, license.tier])

  // ─── IDLE ───
  if (advisorScanStatus === 'idle') {
    return (
      <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
        <div className="max-w-5xl mx-auto p-6 h-full flex flex-col items-center justify-center">
          <div className="text-center fade-in">
            {/* Icon */}
            <div className="relative inline-block mb-8">
              <div className="w-28 h-28 rounded-3xl flex items-center justify-center pulse-glow" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <Scan className="w-14 h-14 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl flex items-center justify-center check-animate" style={{ background: '#fff', border: '2px solid #000' }}>
                <Zap className="w-4 h-4 text-black" />
              </div>
            </div>
            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-2">Scan Your PC</h2>
            <p className="text-xs text-[var(--text-tertiary)] max-w-md mx-auto leading-relaxed mb-8">
              Detect gaming performance bottlenecks. Get personalized, safe optimization recommendations.
            </p>
            {/* Button */}
            <button onClick={handleScan}
              className="h-12 px-10 rounded-2xl text-sm font-bold btn-primary flex items-center gap-2.5 mx-auto hover-lift">
              <Scan className="w-4 h-4" />
              Start System Scan
            </button>
            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 mt-8">
              {['Safe & reversible', 'Gaming-focused', 'No fake fixes'].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  <Shield className="w-3 h-3" />{t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── SCANNING ───
  if (advisorScanStatus === 'scanning') {
    const steps = scanSteps.current
    const progress = ((scanStep + 1) / steps.length) * 100

    return (
      <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
        <div className="max-w-5xl mx-auto p-6 h-full flex flex-col items-center justify-center fade-in">
          <div className="rounded-3xl p-10 flex flex-col items-center gap-8 w-full max-w-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            {/* Icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center pulse-glow" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-white mb-1">Analyzing System</div>
              <div className="text-xs text-[var(--text-tertiary)]">{steps[scanStep]?.label || 'Preparing...'}</div>
            </div>
            {/* Steps */}
            <div className="w-full max-w-md space-y-2">
              {steps.map((step, i) => {
                const StepIcon = PHASE_ICONS[step.phase] || Scan
                const done = i < scanStep
                const cur = i === scanStep
                return (
                  <div key={step.phase} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: done ? 'rgba(255,255,255,0.08)' : cur ? 'rgba(255,255,255,0.08)' : 'var(--bg-elevated)' }}>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <StepIcon className="w-3.5 h-3.5" style={{ color: cur ? '#fff' : 'var(--text-muted)' }} />}
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: done ? 'var(--text-secondary)' : cur ? '#fff' : 'var(--text-muted)' }}>{step.label}</span>
                  </div>
                )
              })}
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-md progress-bar progress-bar-glow" style={{ '--bar-color': '#fff' } as any}>
              <div className="fill" style={{ width: `${progress}%`, background: '#fff' }} />
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">{Math.round(progress)}% complete</div>
          </div>
        </div>
      </div>
    )
  }

  // ─── RESULTS ───
  if (!advisorResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-xs mb-4 text-[var(--text-tertiary)]">Scan failed. Please try again.</p>
        <button onClick={handleScan} className="h-9 px-5 rounded-xl text-xs font-semibold btn-primary">Retry</button>
      </div>
    )
  }

  const scoreColor = advisorResult.score >= 70 ? '#fff' : advisorResult.score >= 40 ? '#ccc' : '#999'

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-5 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
              <Scan className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Scan Results</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                Score: {advisorResult.score}/100 · {visibleIssues.length} issue{visibleIssues.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={handleScan}
              className="h-10 px-4 rounded-xl text-[11px] font-semibold flex items-center gap-2 transition-all"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
              <RefreshCw className="w-3.5 h-3.5" /> Re-scan
            </button>
            {visibleIssues.length > 0 && (
              <button onClick={handleOneClickOptimize} disabled={optimizingAll}
                className="h-10 px-5 rounded-xl text-[11px] font-bold flex items-center gap-2 btn-primary disabled:opacity-50">
                {optimizingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Fix All
              </button>
            )}
          </div>
        </div>

        {/* Score Card */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-6">
            {/* Score ring */}
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={`${advisorResult.score * 3.267} ${326.7 - advisorResult.score * 3.267}`}
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-white">{advisorResult.score}</div>
                <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest">/ 100</div>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-white mb-1">
                {advisorResult.score >= 80 ? 'System looks great!' : advisorResult.score >= 50 ? 'Room for improvement' : 'Significant issues detected'}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">
                {visibleIssues.filter(i => i.severity === 'high').length} high, {visibleIssues.filter(i => i.severity === 'medium').length} medium, {visibleIssues.filter(i => i.severity === 'low').length} low severity issues
              </div>
            </div>
          </div>
        </div>

        {/* Optimize result */}
        {optimizeResult && (
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span className="text-xs font-semibold text-white">Applied {optimizeResult.applied} fixes successfully</span>
          </div>
        )}

        {/* Issues */}
        <div className="space-y-2 stagger">
          {visibleIssues.map(issue => {
            const isApplied = appliedIssues.has(issue.id)
            const isFixing = fixingIssue === issue.id
            const hasAccess = canAccessTier(license.tier, issue.requiredTier)
            const severityColor = issue.severity === 'high' ? '#fff' : issue.severity === 'medium' ? '#ccc' : '#999'

            return (
              <div key={issue.id} className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--accent-dim)' }}>
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{issue.title}</span>
                    <span className="text-[7px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.06)', color: severityColor }}>
                      {issue.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{issue.description}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isApplied ? (
                    <span className="text-[10px] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fixed
                    </span>
                  ) : !hasAccess ? (
                    <span className="text-[8px] font-bold tracking-wider uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      <Lock className="w-3 h-3" /> PRO
                    </span>
                  ) : (
                    <button onClick={() => handleFix(issue)} disabled={isFixing}
                      className="h-9 px-4 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 btn-primary disabled:opacity-50">
                      {isFixing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                      Fix
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {visibleIssues.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div className="text-lg font-bold text-white mb-1">All clear!</div>
            <div className="text-xs text-[var(--text-muted)]">No issues found</div>
          </div>
        )}
      </div>
    </div>
  )
}
