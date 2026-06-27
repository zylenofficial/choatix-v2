'use client'

import { useState, useCallback, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { performAdvisorScan, getScanSteps, applyAdvisorFix } from '@/lib/advisor'
import { canAccessTier } from '@/lib/featureAccess'
import { AdvisorIssue } from '@/types'
import { Scan, CheckCircle2, Cpu, HardDrive, Wifi, MemoryStick, Gauge, Monitor, Shield, Zap, Loader2, ShieldAlert, RefreshCw, Lock } from 'lucide-react'

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
      <div className="p-6 h-full flex flex-col items-center justify-center fade-in">
        <div className="w-36 h-36 rounded-[28px] flex items-center justify-center mb-8 relative pulse-glow" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <Scan className="w-16 h-16" style={{ color: 'var(--accent)' }} />
          <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
        </div>
        <h2 className="text-[22px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Scan Your PC</h2>
        <p className="text-[12px] text-center max-w-sm mb-8 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          Detect gaming performance bottlenecks. Get personalized, safe optimization recommendations.
        </p>
        <button
          onClick={handleScan}
          className="h-12 px-10 rounded-2xl text-[12px] font-bold tracking-wide btn-primary flex items-center gap-2.5"
        >
          <Scan className="w-4 h-4" />
          Start System Scan
        </button>
        <div className="flex items-center gap-6 mt-8">
          {['Safe & reversible', 'Gaming-focused', 'No fake fixes'].map(t => (
            <div key={t} className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <Shield className="w-3 h-3" />{t}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── SCANNING ───
  if (advisorScanStatus === 'scanning') {
    const steps = scanSteps.current
    const progress = ((scanStep + 1) / steps.length) * 100
    const CurrentIcon = PHASE_ICONS[steps[scanStep]?.phase] || Scan

    return (
      <div className="p-6 h-full flex flex-col items-center justify-center fade-in">
        <div className="w-36 h-36 rounded-[28px] flex items-center justify-center mb-8 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <CurrentIcon className="w-16 h-16 scan-pulse" style={{ color: 'var(--accent)' }} />
          <div className="absolute inset-0 scan-line" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)' }} />
        </div>
        <h2 className="text-[22px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Analyzing System</h2>
        <p className="text-[12px] mb-8 font-semibold" style={{ color: 'var(--accent)' }}>{steps[scanStep]?.label || 'Preparing...'}</p>
        <div className="w-80 space-y-2.5 mb-6">
          {steps.map((step, i) => {
            const StepIcon = PHASE_ICONS[step.phase] || Scan
            const done = i < scanStep
            const cur = i === scanStep
            return (
              <div key={step.phase} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ background: done ? 'rgba(255,255,255,0.10)' : cur ? 'rgba(255,255,255,0.10)' : 'var(--bg-active)', border: `1px solid ${done ? 'rgba(255,255,255,0.15)' : cur ? 'rgba(255,255,255,0.15)' : 'transparent'}` }}>
                  {done ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} /> : <StepIcon className="w-3.5 h-3.5" style={{ color: cur ? 'var(--accent)' : 'var(--text-muted)' }} />}
                </div>
                <span className="text-[11px] font-medium" style={{ color: done ? 'var(--text-secondary)' : cur ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.label}</span>
              </div>
            )
          })}
        </div>
        <div className="w-80 progress-bar progress-bar-glow" style={{ '--bar-color': 'var(--accent)' } as any}>
          <div className="fill" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
        </div>
        <div className="text-[10px] mt-3 font-medium" style={{ color: 'var(--text-muted)' }}>{Math.round(progress)}% complete</div>
      </div>
    )
  }

  // ─── RESULTS ───
  if (!advisorResult) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <p className="text-[12px] mb-4" style={{ color: 'var(--text-tertiary)' }}>Scan failed. Please try again.</p>
        <button onClick={handleScan} className="h-9 px-5 rounded-lg text-[11px] font-semibold btn-primary">Retry</button>
      </div>
    )
  }

  const scoreColor = advisorResult.score >= 70 ? 'var(--success)' : advisorResult.score >= 40 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div className="p-5 lg:p-6 space-y-5 fade-in overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Scan Results</h1>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Score: {advisorResult.score}/100 · {visibleIssues.length} issue{visibleIssues.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleScan} className="h-9 px-4 rounded-lg text-[11px] font-semibold flex items-center gap-1.5" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
            <RefreshCw className="w-3.5 h-3.5" /> Re-scan
          </button>
          {visibleIssues.length > 0 && (
            <button onClick={handleOneClickOptimize} disabled={optimizingAll} className="h-9 px-5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 btn-primary">
              {optimizingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Fix All
            </button>
          )}
        </div>
      </div>

      {/* Score Card */}
      <div className="card-widget p-6 card-glow relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 20% 50%, ${scoreColor}06 0%, transparent 50%)` }} />
        <div className="relative flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ background: `${scoreColor}08`, border: `1px solid ${scoreColor}12` }}>
            <span className="text-4xl font-bold count-animate" style={{ color: scoreColor, filter: `drop-shadow(0 0 10px ${scoreColor}30)` }}>{advisorResult.score}</span>
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {advisorResult.score >= 80 ? 'System looks great!' : advisorResult.score >= 50 ? 'Room for improvement' : 'Significant issues detected'}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              {visibleIssues.filter(i => i.severity === 'high').length} high, {visibleIssues.filter(i => i.severity === 'medium').length} medium, {visibleIssues.filter(i => i.severity === 'low').length} low severity issues
            </div>
          </div>
        </div>
      </div>

      {/* Optimize result */}
      {optimizeResult && (
        <div className="card-widget p-4 card-glow" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
            <span className="text-[12px] font-semibold" style={{ color: 'var(--success)' }}>Applied {optimizeResult.applied} fixes successfully</span>
          </div>
        </div>
      )}

      {/* Issues */}
      <div className="space-y-2 stagger">
        {visibleIssues.map(issue => {
          const isApplied = appliedIssues.has(issue.id)
          const isFixing = fixingIssue === issue.id
          const hasAccess = canAccessTier(license.tier, issue.requiredTier)
          const severityColor = issue.severity === 'high' ? 'var(--danger)' : issue.severity === 'medium' ? 'var(--warning)' : 'var(--info)'

          return (
            <div key={issue.id} className="card-widget p-4 card-glow flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${severityColor}08`, border: `1px solid ${severityColor}12` }}>
                <ShieldAlert className="w-5 h-5" style={{ color: severityColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{issue.title}</span>
                  <span className="text-[7px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded" style={{ background: `${severityColor}10`, color: severityColor }}>{issue.severity}</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{issue.description}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isApplied ? (
                  <span className="text-[10px] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fixed
                  </span>
                ) : !hasAccess ? (
                  <span className="text-[8px] font-bold tracking-widest uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1" style={{ background: 'var(--bg-active)', color: 'var(--text-muted)' }}>
                    <Lock className="w-3 h-3" /> PRO
                  </span>
                ) : (
                  <button onClick={() => handleFix(issue)} disabled={isFixing} className="h-9 px-4 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 btn-primary">
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
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--success-dim)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--success)' }} />
          </div>
          <div className="text-[15px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>All clear!</div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No issues found</div>
        </div>
      )}
    </div>
  )
}
