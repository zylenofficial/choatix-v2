'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bot, Cpu, MemoryStick, Monitor, HardDrive, Zap, ChevronRight, ChevronDown, AlertTriangle, CheckCircle, Info, Search } from 'lucide-react'

interface Spec {
  cpu?: string
  gpu?: string
  ram?: number
  refreshRate?: number
  game?: string
}

interface Recommendation {
  category: string
  setting: string
  currentValue: string
  recommended: string
  reason: string
  fpsGain: [number, number]
  risk: 'None' | 'Low' | 'Medium' | 'High'
  reversible: boolean
}

interface AnalysisResult {
  recommendations: Recommendation[]
  totalFpsGain: [number, number]
  totalLowImprovement: [number, number]
  latencyReduction: [number, number]
  confidence: 'High' | 'Medium' | 'Low'
  performanceScore: number
  remainingPotential: 'Low' | 'Medium' | 'High'
}

function analyzeHardware(spec: Spec): AnalysisResult {
  const recs: Recommendation[] = []
  const cpu = (spec.cpu || '').toLowerCase()
  const gpu = (spec.gpu || '').toLowerCase()
  const ram = spec.ram || 8

  const isAmd = cpu.includes('amd') || cpu.includes('ryzen')
  const isIntel = cpu.includes('intel') || cpu.includes('core') || cpu.includes('i3') || cpu.includes('i5') || cpu.includes('i7') || cpu.includes('i9')
  const isNvidia = gpu.includes('nvidia') || gpu.includes('geforce') || gpu.includes('rtx') || gpu.includes('gtx')
  const isAmdGpu = gpu.includes('radeon') || gpu.includes('rx') || gpu.includes('amd')
  const isHighEnd = cpu.includes('i9') || cpu.includes('ryzen 9') || cpu.includes('ryzen 7') || cpu.includes('i7')
  const isLowEnd = cpu.includes('i3') || cpu.includes('ryzen 3') || cpu.includes('pentium') || cpu.includes('celeron')

  // Windows
  recs.push({
    category: 'Power Plan',
    setting: 'Power Plan',
    currentValue: 'Balanced',
    recommended: 'High Performance or Ultimate Performance',
    reason: 'Maximum CPU frequency and prevents power throttling during gameplay.',
    fpsGain: [5, 15],
    risk: 'None',
    reversible: true,
  })

  recs.push({
    category: 'Windows',
    setting: 'Game Mode',
    currentValue: 'Unknown',
    recommended: 'Enabled',
    reason: 'Prioritizes game processes and prevents Windows updates from interrupting gameplay.',
    fpsGain: [1, 3],
    risk: 'None',
    reversible: true,
  })

  recs.push({
    category: 'Windows',
    setting: 'Hardware-Accelerated GPU Scheduling',
    currentValue: 'Unknown',
    recommended: 'Enabled (Windows 10 2004+)',
    reason: 'Reduces CPU scheduling overhead by letting the GPU manage its own memory.',
    fpsGain: [1, 5],
    risk: 'None',
    reversible: true,
  })

  recs.push({
    category: 'Windows',
    setting: 'Fullscreen Optimizations',
    currentValue: 'Enabled',
    recommended: 'Disabled for game exe',
    reason: 'Prevents Windows overlay from interfering with exclusive fullscreen mode.',
    fpsGain: [1, 3],
    risk: 'None',
    reversible: true,
  })

  recs.push({
    category: 'Windows',
    setting: 'Visual Effects',
    currentValue: 'Let Windows choose',
    recommended: 'Best Performance',
    reason: 'Disables animations and transparency freeing GPU/CPU resources for games.',
    fpsGain: [2, 8],
    risk: 'None',
    reversible: true,
  })

  recs.push({
    category: 'Background Apps',
    setting: 'Background Apps',
    currentValue: 'Enabled',
    recommended: 'Disabled',
    reason: 'Prevents UWP apps from consuming RAM and CPU in background while gaming.',
    fpsGain: [3, 10],
    risk: 'None',
    reversible: true,
  })

  recs.push({
    category: 'Startup Programs',
    setting: 'Unnecessary Startup Programs',
    currentValue: 'Unknown',
    recommended: 'Disable non-essential',
    reason: 'Reduces boot time and frees RAM for games. Browser updaters, cloud sync, etc.',
    fpsGain: [2, 8],
    risk: 'None',
    reversible: true,
  })

  // GPU specific
  if (isNvidia) {
    recs.push({
      category: 'NVIDIA Settings',
      setting: 'Power Management Mode',
      currentValue: 'Optimal Power',
      recommended: 'Prefer Maximum Performance',
      reason: 'Prevents GPU clock speed drops during gameplay.',
      fpsGain: [3, 10],
      risk: 'None',
      reversible: true,
    })

    recs.push({
      category: 'NVIDIA Settings',
      setting: 'Low Latency Mode',
      currentValue: 'Off',
      recommended: 'On / Ultra',
      reason: 'Reduces render queue delay, lowering input latency.',
      fpsGain: [0, 2],
      risk: 'None',
      reversible: true,
    })

    recs.push({
      category: 'NVIDIA Settings',
      setting: 'Texture Filtering Quality',
      currentValue: 'Quality',
      recommended: 'High Performance',
      reason: 'Reduces texture filtering overhead with minimal visual difference.',
      fpsGain: [2, 5],
      risk: 'None',
      reversible: true,
    })

    recs.push({
      category: 'GPU',
      setting: 'Driver Version',
      currentValue: 'Unknown',
      recommended: 'Latest Game Ready Driver',
      reason: 'Newer drivers include game-specific optimizations and bug fixes.',
      fpsGain: [2, 8],
      risk: 'None',
      reversible: true,
    })
  }

  if (isAmdGpu) {
    recs.push({
      category: 'AMD Settings',
      setting: 'Radeon Chill',
      currentValue: 'Unknown',
      recommended: 'Disabled',
      reason: 'Radeon Chill caps FPS to save power, hurting performance.',
      fpsGain: [3, 15],
      risk: 'None',
      reversible: true,
    })

    recs.push({
      category: 'AMD Settings',
      setting: 'Radeon Anti-Lag',
      currentValue: 'Unknown',
      recommended: 'Enabled',
      reason: 'Reduces input-to-display latency by optimizing CPU-GPU frame pacing.',
      fpsGain: [0, 3],
      risk: 'None',
      reversible: true,
    })
  }

  // CPU specific
  if (isIntel) {
    recs.push({
      category: 'CPU',
      setting: 'Intel SpeedStep / Thermal Velocity Boost',
      currentValue: 'Enabled',
      recommended: 'Disabled in BIOS (optional)',
      reason: 'Prevents CPU from downclocking under thermal limits during sustained loads.',
      fpsGain: [3, 10],
      risk: 'Low',
      reversible: true,
    })
  }

  if (isAmd) {
    recs.push({
      category: 'CPU',
      setting: 'CPPC / CPPC Preferred Cores',
      currentValue: 'Enabled',
      recommended: 'Enabled (verify in BIOS)',
      reason: 'Ensures Windows schedules threads on the fastest cores first.',
      fpsGain: [2, 7],
      risk: 'None',
      reversible: true,
    })
  }

  recs.push({
    category: 'CPU',
    setting: 'Core Parking',
    currentValue: 'Unknown',
    recommended: '100% active (all cores unparked)',
    reason: 'Parked cores cannot process game threads, causing frame drops.',
    fpsGain: [3, 12],
    risk: 'None',
    reversible: true,
  })

  recs.push({
    category: 'CPU',
    setting: 'Process Priority',
    currentValue: 'Normal',
    recommended: 'High for game exe',
    reason: 'Ensures game gets CPU time before background processes.',
    fpsGain: [2, 8],
    risk: 'None',
    reversible: true,
  })

  // RAM
  if (ram <= 8) {
    recs.push({
      category: 'RAM',
      setting: 'Page File Size',
      currentValue: 'System Managed',
      recommended: '1.5x RAM (12 GB for 8 GB)',
      reason: 'Low RAM systems need proper page file to avoid crashes and stuttering.',
      fpsGain: [3, 10],
      risk: 'Low',
      reversible: true,
    })
  }

  recs.push({
    category: 'RAM',
    setting: 'Memory Compression',
    currentValue: 'Enabled',
    recommended: 'Disable if 16 GB+',
    reason: 'Memory compression uses CPU cycles. Disabling on high-RAM systems frees CPU.',
    fpsGain: [1, 4],
    risk: 'Low',
    reversible: true,
  })

  recs.push({
    category: 'Storage',
    setting: 'Game on SSD vs HDD',
    currentValue: 'Unknown',
    recommended: 'SSD (NVMe preferred)',
    reason: 'SSD eliminates texture streaming stutter and reduces load times drastically.',
    fpsGain: [5, 20],
    risk: 'None',
    reversible: true,
  })

  recs.push({
    category: 'Storage',
    setting: 'Storage Trim',
    currentValue: 'Unknown',
    recommended: 'Enabled for SSDs',
    reason: 'Maintains SSD write performance over time.',
    fpsGain: [0, 2],
    risk: 'None',
    reversible: true,
  })

  // Network (latency only)
  recs.push({
    category: 'Network',
    setting: 'Network Throttling Index',
    currentValue: 'Enabled',
    recommended: 'Disabled (hex: ff)',
    reason: 'Windows throttles network traffic by default, adding latency in online games.',
    fpsGain: [0, 0],
    risk: 'None',
    reversible: true,
  })

  recs.push({
    category: 'Network',
    setting: 'Nagle Algorithm (TCP)',
    currentValue: 'Enabled',
    recommended: 'Disabled for gaming',
    reason: 'Nagle batches small packets, increasing latency. Disabling sends immediately.',
    fpsGain: [0, 0],
    risk: 'None',
    reversible: true,
  })

  // BIOS
  if (isHighEnd) {
    recs.push({
      category: 'BIOS',
      setting: 'XMP / EXPO Profile',
      currentValue: 'Disabled (JEDEC)',
      recommended: 'Enabled (XMP/EXPO)',
      reason: 'RAM runs at 2133 MHz by default. XMP enables advertised speeds (3200-6000 MHz).',
      fpsGain: [5, 20],
      risk: 'Low',
      reversible: true,
    })
  }

  recs.push({
    category: 'BIOS',
    setting: 'Resizable BAR (ReBAR / SAM)',
    currentValue: 'Unknown',
    recommended: 'Enabled',
    reason: 'Allows CPU to access full GPU VRAM, improving draw call performance.',
    fpsGain: [2, 10],
    risk: 'Low',
    reversible: true,
  })

  // Advanced (if high end)
  if (isHighEnd) {
    recs.push({
      category: 'Advanced',
      setting: 'MSI Mode for GPU',
      currentValue: 'Unknown',
      recommended: 'Enable (if supported)',
      reason: 'Allows GPU to use message-signaled interrupts, reducing DPC latency.',
      fpsGain: [1, 5],
      risk: 'Medium',
      reversible: true,
    })

    recs.push({
      category: 'Advanced',
      setting: 'Timer Resolution',
      currentValue: '15.6 ms (default)',
      recommended: '0.5 ms (when gaming)',
      reason: 'Higher timer resolution reduces input latency in games that poll input.',
      fpsGain: [0, 2],
      risk: 'Low',
      reversible: true,
    })

    recs.push({
      category: 'Advanced',
      setting: 'HPET (High Precision Event Timer)',
      currentValue: 'Enabled',
      recommended: 'Disabled (bcdedit)',
      reason: 'HPET can cause timer inconsistencies and micro-stutters in some games.',
      fpsGain: [1, 5],
      risk: 'Medium',
      reversible: true,
    })
  }

  // Game specific
  if (spec.game) {
    recs.push({
      category: 'Game Graphics',
      setting: 'Render Scale / Resolution',
      currentValue: '100%',
      recommended: '90-95% (if FPS needed)',
      reason: 'Slight resolution reduction has minimal visual impact but significant FPS gain.',
      fpsGain: [5, 25],
      risk: 'None',
      reversible: true,
    })

    recs.push({
      category: 'Game Graphics',
      setting: 'Shadow Quality',
      currentValue: 'High/Epic',
      recommended: 'Medium/Low',
      reason: 'Shadows are one of the most GPU-expensive settings in most games.',
      fpsGain: [3, 15],
      risk: 'None',
      reversible: true,
    })

    recs.push({
      category: 'Game Graphics',
      setting: 'Ray Tracing',
      currentValue: 'Unknown',
      recommended: 'Off (for max FPS)',
      reason: 'Ray tracing is extremely GPU-heavy. Disabling gives massive FPS boost.',
      fpsGain: [15, 60],
      risk: 'None',
      reversible: true,
    })

    recs.push({
      category: 'Game Graphics',
      setting: 'DLSS / FSR / XeSS',
      currentValue: 'Unknown',
      recommended: 'Quality or Balanced',
      reason: 'AI upscaling renders at lower resolution and reconstructs image, boosting FPS.',
      fpsGain: [10, 40],
      risk: 'None',
      reversible: true,
    })

    recs.push({
      category: 'Game Graphics',
      setting: 'Motion Blur',
      currentValue: 'Unknown',
      recommended: 'Off',
      reason: 'Motion blur adds post-processing overhead and reduces clarity in fast movement.',
      fpsGain: [1, 3],
      risk: 'None',
      reversible: true,
    })
  }

  // Calculate totals
  let totalMin = 0, totalMax = 0
  recs.forEach(r => {
    totalMin += r.fpsGain[0]
    totalMax += r.fpsGain[1]
  })

  const lowImpMin = Math.round(totalMin * 0.4)
  const lowImpMax = Math.round(totalMax * 0.6)
  const latencyMin = Math.round(totalMin * 0.15)
  const latencyMax = Math.round(totalMax * 0.35)

  let score = 60
  if (isHighEnd) score = 72
  if (isLowEnd) score = 45

  return {
    recommendations: recs,
    totalFpsGain: [totalMin, totalMax],
    totalLowImprovement: [lowImpMin, lowImpMax],
    latencyReduction: [latencyMin, latencyMax],
    confidence: isHighEnd ? 'High' : isLowEnd ? 'Medium' : 'High',
    performanceScore: score,
    remainingPotential: totalMax > 30 ? 'High' : totalMax > 15 ? 'Medium' : 'Low',
  }
}

const categoryIcons: Record<string, string> = {
  'Power Plan': '⚡',
  'Windows': '🪟',
  'Background Apps': '📱',
  'Startup Programs': '🚀',
  'NVIDIA Settings': '🟢',
  'AMD Settings': '🔴',
  'CPU': '🧠',
  'GPU': '🎮',
  'RAM': '💾',
  'Storage': '💿',
  'Network': '🌐',
  'BIOS': '⚙️',
  'Advanced': '🔬',
  'Game Graphics': '🖼',
}

const riskColors: Record<string, string> = {
  'None': 'var(--success)',
  'Low': 'var(--warning)',
  'Medium': '#ff8800',
  'High': 'var(--danger)',
}

export function AIOptimizerPage() {
  const [spec, setSpec] = useState<Spec>({ cpu: '', gpu: '', ram: 16, game: '' })
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const detect = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      const info = await window.electronAPI.advisorScan()
      setSpec(prev => ({
        ...prev,
        cpu: info?.systemInfo?.cpu?.model || prev.cpu,
        gpu: info?.systemInfo?.gpu?.model || prev.gpu,
        ram: info?.systemInfo?.ram?.total ? Math.round(info.systemInfo.ram.total) : prev.ram,
      }))
    } catch {}
  }, [])

  useEffect(() => { detect() }, [detect])

  const runAnalysis = () => {
    setAnalyzing(true)
    setTimeout(() => {
      const r = analyzeHardware(spec)
      setResult(r)
      setAnalyzing(false)
      if (r.recommendations.length > 0) {
        setExpandedCat(r.recommendations[0].category)
      }
    }, 1500)
  }

  const grouped = result ? result.recommendations.reduce<Record<string, Recommendation[]>>((acc, rec) => {
    if (!acc[rec.category]) acc[rec.category] = []
    acc[rec.category].push(rec)
    return acc
  }, {}) : {}

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: 'thin' }}>
      <div className="flex items-center gap-3 mb-2">
        <Bot className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        <div>
          <h1 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>AI FPS Optimizer</h1>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Analyze your PC and get personalized optimization recommendations</p>
        </div>
      </div>

      {!result && (
        <div className="p-4 rounded-xl space-y-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Your System</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] block mb-1" style={{ color: 'var(--text-muted)' }}>CPU</label>
              <input value={spec.cpu} onChange={e => setSpec(p => ({ ...p, cpu: e.target.value }))} placeholder="e.g. AMD Ryzen 7 5800X"
                className="w-full px-3 py-2 rounded-lg text-[11px] outline-none" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: 'var(--text-muted)' }}>GPU</label>
              <input value={spec.gpu} onChange={e => setSpec(p => ({ ...p, gpu: e.target.value }))} placeholder="e.g. NVIDIA RTX 4070"
                className="w-full px-3 py-2 rounded-lg text-[11px] outline-none" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: 'var(--text-muted)' }}>RAM (GB)</label>
              <input type="number" value={spec.ram} onChange={e => setSpec(p => ({ ...p, ram: parseInt(e.target.value) || 8 }))}
                className="w-full px-3 py-2 rounded-lg text-[11px] outline-none" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: 'var(--text-muted)' }}>Game (optional)</label>
              <input value={spec.game} onChange={e => setSpec(p => ({ ...p, game: e.target.value }))} placeholder="e.g. Fortnite, Valorant"
                className="w-full px-3 py-2 rounded-lg text-[11px] outline-none" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
            </div>
          </div>
          <button onClick={runAnalysis} disabled={analyzing}
            className="w-full py-2.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-90 disabled:opacity-50 btn-primary flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)', color: '#000' }}>
            {analyzing ? (
              <><span className="animate-spin">⟳</span> Analyzing your system...</>
            ) : (
              <><Search className="w-3 h-3" /> Analyze &amp; Optimize</>
            )}
          </button>
        </div>
      )}

      {result && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-[20px] font-bold" style={{ color: 'var(--success)' }}>+{result.totalFpsGain[0]}-{result.totalFpsGain[1]}</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>FPS Gain</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>+{result.totalLowImprovement[0]}-{result.totalLowImprovement[1]}%</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>1% Low</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-[20px] font-bold" style={{ color: 'var(--accent)' }}>-{result.latencyReduction[0]}-{result.latencyReduction[1]}ms</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Latency</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>{result.performanceScore}/100</div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Score</div>
            </div>
          </div>

          <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>Remaining Optimization Potential: {result.remainingPotential}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Confidence: {result.confidence} • {result.recommendations.length} recommendations</div>
            </div>
            <button onClick={() => { setResult(null); setSpec({ cpu: '', gpu: '', ram: 16, game: '' }) }}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
              Re-analyze
            </button>
          </div>

          <div className="space-y-2">
            {Object.entries(grouped).map(([cat, recs]) => (
              <div key={cat} className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <button onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:opacity-90 transition-opacity">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">{categoryIcons[cat] || '📋'}</span>
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{cat}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{recs.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold" style={{ color: 'var(--success)' }}>+{Math.min(...recs.map(r => r.fpsGain[0]))}-{Math.max(...recs.map(r => r.fpsGain[1]))} FPS</span>
                    {expandedCat === cat ? <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </button>
                {expandedCat === cat && (
                  <div className="px-4 pb-3 space-y-2">
                    {recs.map((rec, i) => (
                      <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{rec.setting}</div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: riskColors[rec.risk] + '20', color: riskColors[rec.risk] }}>{rec.risk} risk</span>
                            {rec.reversible && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--success)20', color: 'var(--success)' }}>Reversible</span>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-1.5">
                          <div>
                            <span className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>Current: </span>
                            <span className="text-[10px]" style={{ color: 'var(--danger)' }}>{rec.currentValue || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>Recommended: </span>
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--success)' }}>{rec.recommended}</span>
                          </div>
                        </div>
                        <div className="text-[10px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>{rec.reason}</div>
                        <div className="text-[10px] font-bold" style={{ color: 'var(--success)' }}>
                          Estimated FPS Gain: +{rec.fpsGain[0]} to +{rec.fpsGain[1]} FPS
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
