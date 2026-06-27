'use client'

import { useState, useCallback, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { performAdvisorScan, getScanSteps, applyAdvisorFix } from '@/lib/advisor'
import { canAccessTier } from '@/lib/featureAccess'
import { AdvisorIssue, LicenseTier, SystemPerfClass, DeviceType } from '@/types'
import { OptimizationCard } from '@/components/OptimizationCard'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { UpgradeModal } from '@/components/UpgradeModal'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Scan, Shield, Zap, Activity, Monitor, Laptop, ArrowRight, RefreshCw, CheckCircle2, Cpu, HardDrive, Wifi, MemoryStick, Gauge } from 'lucide-react'

const CLASS_CONFIG: Record<SystemPerfClass, { label: string; sub: string; color: string }> = {
  HIGH: { label: 'Optimized', sub: 'System is running well', color: 'text-white' },
  MID: { label: 'Fair', sub: 'Room for improvement', color: 'text-white/60' },
  LOW: { label: 'Needs Attention', sub: 'Multiple optimizations available', color: 'text-white/40' },
  'STUTTER RISK': { label: 'Stutter Risk', sub: 'Performance issues detected', color: 'text-white/50' },
}

const PHASE_ICONS: Record<string, any> = {
  cpu: Cpu,
  ram: MemoryStick,
  disk: HardDrive,
  gpu: Monitor,
  network: Wifi,
  startup: Activity,
  power: Gauge,
  analysis: Scan,
}

export function AdvisorPage() {
  const {
    license, setLicense,
    advisorResult, setAdvisorResult,
    advisorScanStatus, setAdvisorScanStatus,
    advisorDismissedIssues, dismissAdvisorIssue,
    addRollbackEntry, updateTweak,
  } = useStore()

  const [scanStep, setScanStep] = useState(0)
  const [fixingIssue, setFixingIssue] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [appliedIssues, setAppliedIssues] = useState<Set<string>>(new Set())
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
      await new Promise(r => setTimeout(r, 300 + Math.random() * 250))
    }

    const { result } = await performAdvisorScan(license.tier)
    if (result) setAdvisorResult(result)
    setAdvisorScanStatus('complete')
  }, [license.tier, setAdvisorResult, setAdvisorScanStatus])

  const handleFix = useCallback(async (issue: AdvisorIssue) => {
    if (!canAccessTier(license.tier, issue.requiredTier)) {
      setShowUpgradeModal(true)
      return
    }
    setFixingIssue(issue.id)
    try {
      const result = await applyAdvisorFix(issue.tweakId)
      if (result.success) setAppliedIssues(prev => new Set(prev).add(issue.id))
    } catch {}
    setFixingIssue(null)
  }, [license.tier])

  const handleIgnore = useCallback((issueId: string) => {
    dismissAdvisorIssue(issueId)
  }, [dismissAdvisorIssue])

  const handleOptimizeAll = useCallback(async () => {
    const fixableIssues = visibleIssues.filter(i => {
      return canAccessTier(license.tier, i.requiredTier) && !appliedIssues.has(i.id)
    })
    for (const issue of fixableIssues) {
      setFixingIssue(issue.id)
      try {
        const result = await applyAdvisorFix(issue.tweakId)
        if (result.success) setAppliedIssues(prev => new Set(prev).add(issue.id))
      } catch {}
      setFixingIssue(null)
    }
  }, [visibleIssues, license.tier, appliedIssues])

  const handleUpgrade = () => {
    setShowUpgradeModal(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--score-green)'
    if (score >= 60) return 'var(--score-yellow)'
    if (score >= 40) return 'var(--score-orange)'
    return 'var(--score-red)'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'text-white'
    if (score >= 60) return 'text-white/70'
    if (score >= 40) return 'text-white/50'
    return 'text-white/50'
  }

  // ─── IDLE STATE ───
  if (advisorScanStatus === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
            <Scan className="w-10 h-10 text-white/30" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-white/40" />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-white/90 mb-2">Scan Your PC</h1>
        <p className="text-[12px] text-white/30 text-center max-w-sm leading-relaxed mb-8">
          Analyze your system for gaming performance issues.
          Get personalized, safe optimization recommendations.
        </p>

        <Button
          onClick={handleScan}
          className="min-w-[180px] h-10 text-[11px] tracking-wider uppercase"
        >
          <Scan className="w-3.5 h-3.5 mr-2" />
          Start Scan
        </Button>

        <div className="flex items-center gap-6 mt-10">
          {[
            { icon: Shield, label: 'Safe & reversible' },
            { icon: Zap, label: 'Gaming-focused' },
            { icon: CheckCircle2, label: 'No fake fixes' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[10px] text-white/20">
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── SCANNING STATE ───
  if (advisorScanStatus === 'scanning') {
    const steps = scanSteps.current
    const progress = ((scanStep + 1) / steps.length) * 100
    const CurrentIcon = PHASE_ICONS[steps[scanStep]?.phase] || Scan

    return (
      <div className="flex flex-col items-center justify-center py-28">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center overflow-hidden">
            <CurrentIcon className="w-10 h-10 text-white/50 animate-pulse" />
            <div className="absolute inset-0 scan-sweep bg-gradient-to-b from-white/5 via-white/[0.02] to-transparent" />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white/80 mb-1">Analyzing</h2>
        <p className="text-[11px] text-white/40 mb-8">{steps[scanStep]?.label || 'Preparing...'}</p>

        <div className="w-64 space-y-2 mb-6">
          {steps.map((step, i) => {
            const StepIcon = PHASE_ICONS[step.phase] || Scan
            const isComplete = i < scanStep
            const isCurrent = i === scanStep
            return (
              <div key={step.phase} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-300 ${
                  isComplete ? 'bg-white/10' :
                  isCurrent ? 'bg-white/[0.06] border border-white/20' :
                  'bg-white/[0.02]'
                }`}>
                  {isComplete ? (
                    <CheckCircle2 className="w-3 h-3 text-white/50" />
                  ) : (
                    <StepIcon className={`w-2.5 h-2.5 ${isCurrent ? 'text-white/60 animate-pulse' : 'text-white/10'}`} />
                  )}
                </div>
                <span className={`text-[11px] transition-colors duration-300 ${
                  isComplete ? 'text-white/30' :
                  isCurrent ? 'text-white/70' :
                  'text-white/10'
                }`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        <Progress value={progress} className="w-64" />
      </div>
    )
  }

  // ─── COMPLETE / RESULTS ───
  if (!advisorResult) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <p className="text-[11px] text-white/30 mb-4">Scan failed. Please try again.</p>
        <Button variant="outline" onClick={handleScan} className="h-8 text-[11px]">Retry</Button>
      </div>
    )
  }

  const classConfig = CLASS_CONFIG[advisorResult.systemClass]
  const fixableCount = visibleIssues.filter(i => {
    return canAccessTier(license.tier, i.requiredTier) && !appliedIssues.has(i.id)
  }).length

  return (
    <div className="space-y-8 fade-in-up">
      {/* ─── SCORE + SYSTEM INFO ─── */}
      <div className="flex gap-6">
        {/* Score ring */}
        <div className="w-52 flex-shrink-0 border border-white/[0.06] bg-[#0a0a0a] p-6 flex flex-col items-center">
          <div className="score-ring mb-4" style={{ '--pct': advisorResult.score } as React.CSSProperties}>
            <div className="score-value flex flex-col items-center">
              <span className={`text-4xl font-light tracking-tighter ${getScoreLabel(advisorResult.score)}`}>
                {advisorResult.score}
              </span>
              <span className="text-[9px] text-white/20 font-medium tracking-wider uppercase mt-0.5">/ 100</span>
            </div>
          </div>
          <div className={`text-[12px] font-medium ${classConfig.color}`}>{classConfig.label}</div>
          <div className="text-[10px] text-white/20 mt-0.5">{classConfig.sub}</div>

          <div className="flex items-center gap-2 mt-4">
            {advisorResult.deviceType && advisorResult.deviceType !== 'unknown' && (
              <Badge variant="secondary" className="text-[9px] flex items-center gap-1">
                {advisorResult.deviceType === 'laptop' ? <Laptop className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                {advisorResult.deviceType}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[9px]">{advisorResult.systemClass}</Badge>
          </div>
        </div>

        {/* System specs grid */}
        <div className="flex-1 grid grid-cols-3 gap-px bg-white/[0.06]">
          <SpecCard label="CPU" value={advisorResult.systemInfo.cpu.model.split(' ').slice(0, 3).join(' ')} sub={`${advisorResult.systemInfo.cpu.cores} cores`} />
          <SpecCard label="RAM" value={`${(advisorResult.systemInfo.ram.total / 1024).toFixed(0)} GB`} sub={`${((advisorResult.systemInfo.ram.used / advisorResult.systemInfo.ram.total) * 100).toFixed(0)}% used`} />
          <SpecCard label="GPU" value={advisorResult.systemInfo.gpu.model.split(' ').slice(0, 3).join(' ')} sub={advisorResult.systemInfo.gpu.vendor !== 'unknown' ? advisorResult.systemInfo.gpu.vendor : ''} />
          <SpecCard label="Disk" value={`${(advisorResult.systemInfo.disk.total / 1024).toFixed(0)} GB`} sub={`${((advisorResult.systemInfo.disk.used / advisorResult.systemInfo.disk.total) * 100).toFixed(0)}% used`} />
          <SpecCard label="Power" value={advisorResult.systemInfo.powerPlan} sub={advisorResult.systemInfo.gameMode === true ? 'Game Mode ON' : 'Game Mode OFF'} />
          <SpecCard label="Network" value={advisorResult.systemInfo.network.latencyMs !== null ? `${advisorResult.systemInfo.network.latencyMs}ms` : 'N/A'} sub={advisorResult.systemInfo.network.adapterName} />
        </div>
      </div>

      {/* ─── ACTIONS BAR ─── */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-white/30">
          {visibleIssues.length} optimization{visibleIssues.length !== 1 ? 's' : ''} available
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleScan} className="h-7 text-[11px] text-white/40 hover:text-white/70">
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Re-scan
          </Button>
          {fixableCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(true)} className="h-7 text-[11px]">
              <Zap className="w-3 h-3 mr-1.5" />
              Optimize All ({fixableCount})
            </Button>
          )}
        </div>
      </div>

      {/* ─── RECOMMENDATIONS ─── */}
      {visibleIssues.length > 0 && (
        <div className="space-y-2 stagger-children">
          {visibleIssues.map(issue => (
            <OptimizationCard
              key={issue.id}
              issue={issue}
              userTier={license.tier}
              onFix={handleFix}
              onIgnore={handleIgnore}
              isFixing={fixingIssue === issue.id}
              isApplied={appliedIssues.has(issue.id)}
            />
          ))}
        </div>
      )}

      {visibleIssues.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-8 h-8 text-white/15 mx-auto mb-3" />
          <p className="text-[11px] text-white/25 tracking-wider uppercase">All optimizations applied or dismissed</p>
        </div>
      )}

      {/* ─── PREMIUM CTA ─── */}
      {license.tier === LicenseTier.FREE && (
        <div className="border border-white/[0.06] bg-[#0a0a0a] p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-white/50 mb-0.5">Want deeper optimizations?</div>
            <div className="text-[10px] text-white/20">Unlock advanced profiles with Choatix Premium</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowUpgradeModal(true)} className="h-7 text-[11px]">
            <ArrowRight className="w-3 h-3 mr-1.5" />
            Upgrade
          </Button>
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleOptimizeAll}
        title="Optimize All"
        description="All recommended optimizations will be applied. You can revert individual changes from the Rollback tab."
        confirmLabel="Apply All"
        itemCount={fixableCount}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={license.tier}
      />
    </div>
  )
}

function SpecCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#0a0a0a] p-4">
      <div className="text-[9px] text-white/20 tracking-[0.2em] uppercase mb-2">{label}</div>
      <div className="text-[11px] text-white/70 truncate mb-0.5">{value}</div>
      {sub && <div className="text-[10px] text-white/25 truncate">{sub}</div>}
    </div>
  )
}
