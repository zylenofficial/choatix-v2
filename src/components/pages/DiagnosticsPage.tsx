'use client'

import { useState, useCallback } from 'react'
import {
  Search, Cpu, Gauge, Shield, Loader2, CheckCircle2,
  AlertTriangle, Zap, ArrowRight, Info, HardDrive, MemoryStick,
} from 'lucide-react'

interface FpsIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string; desc: string; fix: string | null
}

interface BottleneckData {
  cpu: { name: string; cores: number; threads: number; boost: number; load: number; score: number }
  ram: { total: number; free: number; slots: number; speed: number; usage: number; score: number }
  gpu: { name: string; score: number }
  disk: { free: number; total: number; usage: number; score: number }
  bottleneck: string; bottleneckPct: number
  recommendations: { text: string; icon: string }[]
}

function getSeverityColor(s: string): string {
  if (s === 'critical') return '#f87171'
  if (s === 'high') return '#fb923c'
  if (s === 'medium') return '#fbbf24'
  return '#60a5fa'
}

function getBottleneckColor(b: string): string {
  if (b === 'cpu') return '#f87171'
  if (b === 'ram') return '#fbbf24'
  if (b === 'gpu') return '#60a5fa'
  if (b === 'disk') return '#a78bfa'
  return '#4ade80'
}

function ScoreRing({ score, color, size = 64 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const o = c - (score / 100) * c
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" className="transition-all duration-1000" />
    </svg>
  )
}

export function DiagnosticsPage() {
  const [scanning, setScanning] = useState(false)
  const [issues, setIssues] = useState<FpsIssue[]>([])
  const [bottleneck, setBottleneck] = useState<BottleneckData | null>(null)
  const [fixingIssue, setFixingIssue] = useState<string | null>(null)
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set())

  const runScan = useCallback(async () => {
    setScanning(true)
    setIssues([])
    setBottleneck(null)
    try {
      const [fps, bn] = await Promise.all([
        (window.electronAPI as any)?.diagnoseFps?.(),
        (window.electronAPI as any)?.findBottleneck?.(),
      ])
      if (fps?.success) setIssues(fps.issues)
      if (bn?.success) setBottleneck(bn)
    } catch {}
    setScanning(false)
  }, [])

  const handleFix = useCallback(async (fixId: string) => {
    setFixingIssue(fixId)
    try {
      await (window.electronAPI as any)?.applyTweak?.(fixId)
      setAppliedFixes(prev => new Set(prev).add(fixId))
    } catch {}
    setFixingIssue(null)
  }, [])

  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const highCount = issues.filter(i => i.severity === 'high').length
  const mediumCount = issues.filter(i => i.severity === 'medium').length
  const score = Math.max(0, 100 - (criticalCount * 25 + highCount * 15 + mediumCount * 5))

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#fff' }}>
              <Search className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Diagnostics</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Find what's bottlenecking your FPS</p>
            </div>
          </div>
          <button onClick={runScan} disabled={scanning}
            className="h-11 px-6 rounded-xl text-xs font-bold flex items-center gap-2 btn-primary disabled:opacity-50">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {scanning ? 'Scanning...' : 'Scan PC'}
          </button>
        </div>

        {/* Scanning */}
        {scanning && (
          <div className="rounded-2xl p-10 glass text-center fade-in" style={{ border: '1px solid var(--border-subtle)' }}>
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: '#fff' }} />
            <div className="text-sm font-bold text-white mb-1">Analyzing your system...</div>
            <div className="text-xs text-[var(--text-muted)]">Checking CPU, RAM, GPU, drivers, Windows settings</div>
          </div>
        )}

        {/* Empty State */}
        {!scanning && issues.length === 0 && !bottleneck && (
          <div className="rounded-2xl p-10 glass text-center fade-in" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Search className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Scan Your PC</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Click "Scan PC" to detect FPS issues, find bottlenecks, and get fixes.
            </p>
          </div>
        )}

        {/* Results */}
        {!scanning && (issues.length > 0 || bottleneck) && (
          <>
            {/* Score Header */}
            <div className="rounded-2xl p-5 glass fade-in" style={{ border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <ScoreRing score={score} color={criticalCount > 0 ? '#f87171' : highCount > 0 ? '#fbbf24' : '#4ade80'} size={70} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{score}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {criticalCount > 0 ? 'Critical issues found' : highCount > 0 ? 'Issues found' : 'System looks good'}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {issues.length} issue{issues.length !== 1 ? 's' : ''} detected
                    </div>
                  </div>
                </div>
                {bottleneck && (
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>Bottleneck</div>
                    <div className="text-lg font-black" style={{ color: getBottleneckColor(bottleneck.bottleneck) }}>
                      {bottleneck.bottleneck.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottleneck Cards */}
            {bottleneck && (
              <div className="grid grid-cols-4 gap-3 stagger fade-in">
                {[
                  { label: 'CPU', score: bottleneck.cpu.score, detail: bottleneck.cpu.name, load: `${bottleneck.cpu.load}% load`, color: '#f87171', icon: Cpu },
                  { label: 'RAM', score: bottleneck.ram.score, detail: `${bottleneck.ram.total}GB`, load: `${bottleneck.ram.usage}% used`, color: '#fbbf24', icon: MemoryStick },
                  { label: 'GPU', score: bottleneck.gpu.score, detail: bottleneck.gpu.name, load: '', color: '#60a5fa', icon: Gauge },
                  { label: 'Disk', score: bottleneck.disk.score, detail: `${bottleneck.disk.free}GB free`, load: `${bottleneck.disk.usage}% used`, color: '#a78bfa', icon: HardDrive },
                ].map(comp => (
                  <div key={comp.label} className="rounded-2xl p-4 transition-all"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <comp.icon className="w-3.5 h-3.5" style={{ color: comp.color }} />
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>{comp.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <ScoreRing score={comp.score} color={comp.color} size={50} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold" style={{ color: comp.color }}>{comp.score}%</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-white truncate">{comp.detail}</div>
                        {comp.load && <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{comp.load}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {bottleneck && bottleneck.recommendations.length > 0 && (
              <div className="rounded-2xl p-5 glass fade-in" style={{ border: '1px solid var(--border-subtle)' }}>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>Recommendations</span>
                <div className="space-y-2 mt-3">
                  {bottleneck.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                      <ArrowRight className="w-3 h-3 shrink-0" style={{ color: '#4ade80' }} />
                      <span className="text-[10px] text-white">{rec.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issue Cards */}
            {issues.length > 0 && (
              <div className="grid grid-cols-3 gap-4 stagger fade-in">
                {issues.map((issue, i) => {
                  const isFixed = issue.fix ? appliedFixes.has(issue.fix) : false
                  const isFixing = issue.fix ? fixingIssue === issue.fix : false
                  return (
                    <div key={i} className="rounded-2xl p-5 transition-all"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                          style={{ background: `${getSeverityColor(issue.severity)}18`, color: getSeverityColor(issue.severity) }}>
                          {issue.severity}
                        </span>
                        {isFixed && <CheckCircle2 className="w-4 h-4" style={{ color: '#4ade80' }} />}
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1.5">{issue.title}</h3>
                      <p className="text-[10px] leading-relaxed mb-4" style={{ color: 'var(--text-tertiary)' }}>{issue.desc}</p>
                      {issue.fix && (
                        <button onClick={() => handleFix(issue.fix!)} disabled={isFixing || isFixed}
                          className="w-full h-8 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-40"
                          style={{ background: isFixed ? 'rgba(74,222,128,0.1)' : '#fff', color: isFixed ? '#4ade80' : '#000' }}>
                          {isFixing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          {isFixing ? 'Fixing...' : isFixed ? 'Fixed' : 'Fix'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
