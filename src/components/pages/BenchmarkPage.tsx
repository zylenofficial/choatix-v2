'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { Zap, BarChart3, Cpu, HardDrive, MemoryStick, MonitorSmartphone, ArrowUp, ArrowDown, Minus, Trophy, Clock, Loader2, RotateCcw } from 'lucide-react'

interface BenchmarkResult {
  id: string
  timestamp: number
  label: string
  cpuScore: number
  ramScore: number
  diskScore: number
  gpuScore: number
  overallScore: number
  cpuUsage: number
  ramUsed: number
  ramTotal: number
  diskRead: number
  diskWrite: number
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--success)'
  if (score >= 50) return 'var(--warning)'
  return 'var(--danger)'
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Great'
  if (score >= 50) return 'Good'
  if (score >= 30) return 'Fair'
  return 'Poor'
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const color = getScoreColor(score)
  const circumference = 2 * Math.PI * ((size - 8) / 2)
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={(size-8)/2} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={(size-8)/2} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-bold" style={{ color }}>{Math.round(score)}</div>
      </div>
    </div>
  )
}

function ComparisonBar({ label, before, after, unit, icon: Icon }: {
  label: string; before: number; after: number; unit: string; icon: any
}) {
  const diff = after - before
  const pct = before > 0 ? ((after - before) / before) * 100 : 0
  const improved = diff > 0
  const neutral = Math.abs(pct) < 1

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl card-widget">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <div className="text-xs font-bold text-white mb-2">{label}</div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-[10px] text-[var(--text-muted)] mb-1">Before</div>
            <div className="h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(before, 100)}%`, background: 'rgba(255,255,255,0.2)' }} />
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">{before.toFixed(1)}{unit}</div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-[var(--text-muted)] mb-1">After</div>
            <div className="h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(after, 100)}%`, background: improved ? 'var(--success)' : neutral ? 'rgba(255,255,255,0.4)' : 'var(--danger)' }} />
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">{after.toFixed(1)}{unit}</div>
          </div>
        </div>
      </div>
      <div className="text-right min-w-[60px]">
        {neutral ? (
          <span className="text-[10px] text-[var(--text-muted)]">~0%</span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-bold" style={{ color: improved ? 'var(--success)' : 'var(--danger)' }}>
            {improved ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(pct).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}

export function BenchmarkPage() {
  const { license } = useStore()
  const [beforeResult, setBeforeResult] = useState<BenchmarkResult | null>(null)
  const [afterResult, setAfterResult] = useState<BenchmarkResult | null>(null)
  const [running, setRunning] = useState<'before' | 'after' | null>(null)
  const [progress, setProgress] = useState(0)
  const [history, setHistory] = useState<BenchmarkResult[]>([])
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  const runBenchmark = useCallback(async (label: 'before' | 'after') => {
    setRunning(label)
    setProgress(0)
    const steps = 10
    const results: any[] = []

    for (let i = 0; i < steps; i++) {
      setProgress(((i + 1) / steps) * 100)
      try {
        const stats = await window.electronAPI?.getRealtimeStats()
        if (stats) {
          results.push({
            cpuUsage: stats.cpu.usage,
            ramUsed: stats.ram.used,
            ramTotal: stats.ram.total,
            gpuUsage: stats.gpu.usage,
          })
        }
      } catch {}
      await new Promise(r => setTimeout(r, 500))
    }

    const bench = await window.electronAPI?.runBenchmark()

    const avgCpu = results.length > 0 ? results.reduce((s, r) => s + r.cpuUsage, 0) / results.length : 0
    const avgRam = results.length > 0 ? results.reduce((s, r) => s + r.ramUsed, 0) / results.length : 0
    const ramTotal = results[0]?.ramTotal || 0

    const cpuScore = Math.max(0, 100 - avgCpu)
    const ramScore = ramTotal > 0 ? Math.min(100, (1 - avgRam / ramTotal) * 120) : 50
    const diskScore = bench?.success ? Math.min(100, ((bench.diskReadMBs + bench.diskWriteMBs) / 2) * 2) : 50
    const gpuScore = results.length > 0 ? Math.max(0, 100 - results.reduce((s, r) => s + (r.gpuUsage || 0), 0) / results.length) : 50
    const overallScore = (cpuScore * 0.3 + ramScore * 0.25 + diskScore * 0.25 + gpuScore * 0.2)

    const result: BenchmarkResult = {
      id: Date.now().toString(36),
      timestamp: Date.now(),
      label,
      cpuScore, ramScore, diskScore, gpuScore, overallScore,
      cpuUsage: Math.round(avgCpu * 10) / 10,
      ramUsed: Math.round(avgRam),
      ramTotal: Math.round(ramTotal),
      diskRead: bench?.diskReadMBs || 0,
      diskWrite: bench?.diskWriteMBs || 0,
    }

    if (label === 'before') setBeforeResult(result)
    else setAfterResult(result)

    setHistory(prev => [result, ...prev].slice(0, 20))
    setRunning(null)
    setProgress(0)
  }, [])

  const reset = useCallback(() => {
    setBeforeResult(null)
    setAfterResult(null)
  }, [])

  const hasComparison = beforeResult && afterResult

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 fade-in">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
            <BarChart3 className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Benchmark</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Measure performance before &amp; after tweaks</p>
          </div>
        </div>

        {/* How it works */}
        <div className="card-widget p-4 fade-in">
          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--accent-dim)', color: '#fff' }}>1</span>
              Run before tweaks
            </div>
            <span className="text-[var(--text-muted)]">→</span>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--accent-dim)', color: '#fff' }}>2</span>
              Apply tweaks
            </div>
            <span className="text-[var(--text-muted)]">→</span>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--accent-dim)', color: '#fff' }}>3</span>
              Run after tweaks
            </div>
            <span className="text-[var(--text-muted)]">→</span>
            <span className="font-bold" style={{ color: 'var(--success)' }}>See results</span>
          </div>
        </div>

        {/* Benchmark buttons */}
        <div className="grid grid-cols-2 gap-4">
          {/* Before */}
          <div className="card-widget p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-white">Before Tweaks</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Baseline performance</div>
              </div>
              {beforeResult && (
                <span className="status-badge success" style={{ fontSize: '10px' }}>Done</span>
              )}
            </div>
            {beforeResult ? (
              <div className="flex items-center gap-4">
                <ScoreRing score={beforeResult.overallScore} size={70} />
                <div className="space-y-1.5">
                  <div className="text-[11px] text-[var(--text-secondary)]">CPU: {beforeResult.cpuUsage}%</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">RAM: {beforeResult.ramUsed}MB / {beforeResult.ramTotal}MB</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">Disk R: {beforeResult.diskRead} MB/s</div>
                </div>
              </div>
            ) : (
              <button onClick={() => runBenchmark('before')} disabled={running !== null}
                className="w-full py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 btn-primary disabled:opacity-40">
                {running === 'before' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running... {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    Run Benchmark
                  </>
                )}
              </button>
            )}
          </div>

          {/* After */}
          <div className="card-widget p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-white">After Tweaks</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Optimized performance</div>
              </div>
              {afterResult && (
                <span className="status-badge success" style={{ fontSize: '10px' }}>Done</span>
              )}
            </div>
            {afterResult ? (
              <div className="flex items-center gap-4">
                <ScoreRing score={afterResult.overallScore} size={70} />
                <div className="space-y-1.5">
                  <div className="text-[11px] text-[var(--text-secondary)]">CPU: {afterResult.cpuUsage}%</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">RAM: {afterResult.ramUsed}MB / {afterResult.ramTotal}MB</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">Disk R: {afterResult.diskRead} MB/s</div>
                </div>
              </div>
            ) : (
              <button onClick={() => runBenchmark('after')} disabled={running !== null || !beforeResult}
                className="w-full py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 btn-primary disabled:opacity-40">
                {running === 'after' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running... {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    Run Benchmark
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {running && (
          <div className="card-widget p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">{running === 'before' ? 'Baseline' : 'Optimized'} benchmark</span>
              <span className="text-xs text-[var(--text-muted)]">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--success)' }} />
            </div>
          </div>
        )}

        {/* Comparison results */}
        {hasComparison && (
          <div className="space-y-4 fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Results Comparison</h2>
              <button onClick={reset} className="text-[11px] font-bold text-[var(--text-muted)] hover:text-white flex items-center gap-1 transition-colors">
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Overall improvement */}
            <div className="card-widget p-6 flex items-center gap-6">
              <div className="flex items-center gap-4">
                <ScoreRing score={beforeResult.overallScore} size={80} />
                <div className="text-center">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Before</div>
                  <div className="text-lg font-bold" style={{ color: getScoreColor(beforeResult.overallScore) }}>
                    {getScoreLabel(beforeResult.overallScore)}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  {(() => {
                    const diff = afterResult.overallScore - beforeResult.overallScore
                    const improved = diff > 0
                    return (
                      <>
                        <div className="flex items-center gap-2 justify-center" style={{ color: improved ? 'var(--success)' : 'var(--danger)' }}>
                          {improved ? <ArrowUp className="w-6 h-6" /> : <ArrowDown className="w-6 h-6" />}
                          <span className="text-3xl font-bold">{Math.abs(diff).toFixed(1)}</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">{improved ? 'points improved' : 'points lower'}</div>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">After</div>
                  <div className="text-lg font-bold" style={{ color: getScoreColor(afterResult.overallScore) }}>
                    {getScoreLabel(afterResult.overallScore)}
                  </div>
                </div>
                <ScoreRing score={afterResult.overallScore} size={80} />
              </div>
            </div>

            {/* Detailed comparison */}
            <ComparisonBar label="CPU Performance" before={beforeResult.cpuScore} after={afterResult.cpuScore} unit="pts" icon={Cpu} />
            <ComparisonBar label="Memory Availability" before={beforeResult.ramScore} after={afterResult.ramScore} unit="pts" icon={MemoryStick} />
            <ComparisonBar label="Disk Speed" before={beforeResult.diskScore} after={afterResult.diskScore} unit="pts" icon={HardDrive} />
            <ComparisonBar label="GPU Availability" before={beforeResult.gpuScore} after={afterResult.gpuScore} unit="pts" icon={MonitorSmartphone} />
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white">History</h2>
            <div className="space-y-2">
              {history.map(result => (
                <div key={result.id} className="card-widget px-4 py-3 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                    background: result.label === 'before' ? 'rgba(255,255,255,0.06)' : 'var(--success-dim)'
                  }}>
                    {result.label === 'before' ? (
                      <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                    ) : (
                      <Trophy className="w-4 h-4" style={{ color: 'var(--success)' }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">{result.label === 'before' ? 'Before' : 'After'} Tweaks</div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {new Date(result.timestamp).toLocaleTimeString()} &bull; Score: {result.overallScore.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold" style={{ color: getScoreColor(result.overallScore) }}>
                      {getScoreLabel(result.overallScore)}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">CPU {result.cpuUsage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
