'use client'

import { useState, useCallback, useMemo } from 'react'
import { Zap, Mouse, Loader2, CheckCircle2, Gauge, Shield, Sparkles, ArrowUp, Cpu, Monitor, Wifi, Timer, Volume2, Settings, Crosshair } from 'lucide-react'

const MODULES = [
  { id: 'high-performance', tweakId: 'sys-high-performance', name: 'High Performance Plan', desc: 'Activates the Windows High performance power plan. It can increase heat and battery use.', icon: Gauge, color: '#60a5fa', tag: 'Situational', impact: 'May improve consistency' },
  { id: 'game-mode', tweakId: 'sys-enable-game-mode', name: 'Enable Game Mode', desc: 'Enables the Windows Game Mode preference for the current user.', icon: Zap, color: '#4ade80', tag: 'Low impact', impact: 'Workload-dependent' },
  { id: 'gamebar-capture', tweakId: 'sys-disable-gamebar', name: 'Disable Game Bar Capture', desc: 'Turns off Game Bar capture and background recording. Keep it enabled if you use capture.', icon: Shield, color: '#fb923c', tag: 'Situational', impact: 'Avoids capture overhead' },
  { id: 'core-parking', tweakId: 'cpu-core-parking-disable', name: 'AC Core Parking Minimum', desc: 'Keeps cores active on AC power. This can increase idle power and is not universally beneficial.', icon: Cpu, color: '#a78bfa', tag: 'Situational', impact: 'Hardware-dependent' },
  { id: 'mouse-mapping', tweakId: 'mouse-disable-acceleration', name: 'Consistent Mouse Mapping', desc: 'Disables Enhance Pointer Precision. It changes mouse feel; it does not change USB latency.', icon: Mouse, color: '#fb923c', tag: 'Input preference', impact: 'Consistent pointer mapping' },
  { id: 'ssd-last-access', tweakId: 'storage-ssd-optimization', name: 'NTFS Last-Access Preference', desc: 'Disables last-access updates, a low-impact filesystem preference that modern Windows commonly already uses.', icon: Gauge, color: '#60a5fa', tag: 'Low impact', impact: 'No FPS claim' },
  { id: 'disable-vbs', tweakId: 'sys-disable-vbs', name: 'Disable VBS & Hyper-V', desc: 'Turns off virtualization-based security. This can significantly improve performance in games.', icon: Shield, color: '#f87171', tag: 'High impact', impact: 'Significant FPS gain' },
  { id: 'disable-mitigations', tweakId: 'sys-disable-mitigations', name: 'Disable Mitigations', desc: 'Turns off Windows security mitigations (Spectre/Meltdown). Higher performance but lower security.', icon: Shield, color: '#ef4444', tag: 'High risk', impact: 'Up to 15% CPU gain' },
  { id: 'optimize-fps', tweakId: 'sys-optimize-fps', name: 'Optimize FPS & Input Lag', desc: 'Applies gaming, input, scheduling, timer, and priority tweaks to reduce latency.', icon: Crosshair, color: '#22d3ee', tag: 'Comprehensive', impact: 'Latency + FPS optimization' },
  { id: 'gpu-performance', tweakId: 'gpu-max-performance-mode', name: 'GPU Maximum Performance', desc: 'Sets GPU power management to maximum performance, preventing clock speed drops during gaming.', icon: Monitor, color: '#a78bfa', tag: 'High impact', impact: 'Consistent GPU clocks' },
  { id: 'gpu-power-gating', tweakId: 'gpu-disable-power-gating', name: 'Disable GPU Power Gating', desc: 'Prevents GPU from entering power gating states that cause latency spikes when waking up.', icon: Zap, color: '#fbbf24', tag: 'Situational', impact: 'No GPU wake-up latency' },
  { id: 'network-perf', tweakId: 'net-optimize-performance', name: 'Optimize Network Performance', desc: 'Tunes Windows networking, adapter behavior, offloading, QoS, and TCP settings to reduce lag.', icon: Wifi, color: '#34d399', tag: 'High impact', impact: 'Lower ping, stable connections' },
  { id: 'power-throttling', tweakId: 'sys-disable-power-throttling', name: 'Disable Power Throttling', desc: 'Disables Windows Power Throttling that limits CPU performance of background and foreground processes.', icon: Cpu, color: '#f59e0b', tag: 'High impact', impact: 'No CPU throttling' },
  { id: 'timer-resolution', tweakId: 'sys-set-timer-resolution', name: 'Force High-Resolution Timer', desc: 'Forces the Windows system timer to 0.5ms resolution for the smoothest frame timing.', icon: Timer, color: '#8b5cf6', tag: 'High impact', impact: 'Smoothest frame pacing' },
  { id: 'game-scheduler', tweakId: 'game-optimize-scheduler', name: 'Optimize Game Scheduler', desc: 'Configures Windows thread scheduler for optimal gaming by prioritizing foreground threads.', icon: Settings, color: '#06b6d4', tag: 'High impact', impact: 'Fewer micro-stutters' },
  { id: 'audio-enhancements', tweakId: 'audio-disable-enhancements', name: 'Disable Audio Enhancements', desc: 'Disables Windows audio processing enhancements for lower audio latency.', icon: Volume2, color: '#10b981', tag: 'Medium impact', impact: 'Lower audio latency' },
  { id: 'dpc-latency', tweakId: 'sys-optimize-dpc-latency', name: 'Optimize DPC Latency', desc: 'Reduces Deferred Procedure Call latency for smoother audio and input handling.', icon: Zap, color: '#ec4899', tag: 'High impact', impact: 'No audio crackling' },
  { id: 'directx-optimize', tweakId: 'game-optimize-directx', name: 'Optimize DirectX Settings', desc: 'Configures DirectX for lowest latency with forced hardware acceleration and disabled debug layers.', icon: Monitor, color: '#8b5cf6', tag: 'High impact', impact: 'Lower rendering latency' },
]

export function QuickBoostPage() {
  const [applying, setApplying] = useState<string | null>(null)
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [boosting, setBoosting] = useState(false)

  const handleApply = useCallback(async (moduleId: string, tweakId: string) => {
    setApplying(moduleId)
    try {
      const result = await (window.electronAPI as any)?.applyTweak?.(tweakId)
      if (result?.success === true) {
        setApplied(prev => new Set(prev).add(moduleId))
      }
    } catch {}
    setApplying(null)
  }, [])

  const handleApplyAll = useCallback(async () => {
    setBoosting(true)
    const api = window.electronAPI as any
    for (const mod of MODULES) {
      if (!applied.has(mod.id)) {
        setApplying(mod.id)
        try {
          const result = await api?.applyTweak?.(mod.tweakId)
          if (result?.success === true) setApplied(prev => new Set(prev).add(mod.id))
        } catch {}
        await new Promise(r => setTimeout(r, 120))
      }
    }
    setApplying(null)
    setTimeout(() => setBoosting(false), 600)
  }, [applied])

  const progress = useMemo(() => (applied.size / MODULES.length) * 100, [applied.size])

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between reveal-up reveal-up-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center gradient-border" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              <Sparkles className="w-5 h-5" style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Quick Boost</h1>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{MODULES.length} modules · {applied.size} applied</p>
            </div>
          </div>
        </div>

        {/* Boost Hero */}
        <div className={`rounded-2xl p-8 frosted relative overflow-hidden reveal-up reveal-up-2 ${boosting ? 'boost-pulse' : ''}`}
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none" style={{
            background: `radial-gradient(circle, ${applied.size === MODULES.length ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)'} 0%, transparent 70%)`,
            transition: 'all 0.5s ease',
          }} />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full pointer-events-none" style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)',
          }} />

          <div className="relative flex items-center justify-between" style={{ zIndex: 1 }}>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>QUICK OPTIMIZATION</div>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-4xl font-extralight text-white">{applied.size}</span>
                <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>/ {MODULES.length} modules</span>
              </div>
              <p className="text-[12px] max-w-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
                A short list of verified Windows preferences. These do not promise a universal FPS or ping increase.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              {/* Circular progress */}
              <div className="relative" style={{ width: 100, height: 100 }}>
                <svg width={100} height={100} className="transform -rotate-90">
                  <defs>
                    <linearGradient id="boost-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#a3a3a3" />
                    </linearGradient>
                  </defs>
                  <circle stroke="rgba(255,255,255,0.04)" strokeWidth={5} fill="transparent" r={42} cx={50} cy={50} />
                  <circle
                    stroke="url(#boost-grad)" strokeWidth={5} fill="transparent" r={42}
                    cx={50} cy={50}
                    strokeDasharray={42 * 2 * Math.PI}
                    strokeDashoffset={42 * 2 * Math.PI * (1 - progress / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-light text-white">{Math.round(progress)}%</span>
                </div>
              </div>

              {/* Boost All Button */}
              <button
                onClick={handleApplyAll}
                disabled={applying !== null || applied.size === MODULES.length}
                className="group h-11 px-8 rounded-xl text-[12px] font-bold flex items-center gap-2 btn-primary disabled:opacity-40 transition-all duration-300 ripple"
                style={{
                  boxShadow: applied.size === MODULES.length
                    ? '0 4px 20px rgba(74,222,128,0.2)'
                    : '0 4px 20px rgba(255,255,255,0.1)',
                }}
              >
                {applying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : applied.size === MODULES.length ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                )}
                {applying ? 'Optimizing...' : applied.size === MODULES.length ? 'All Applied' : 'Boost All'}
              </button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-3">
          {MODULES.map((mod, idx) => {
            const Icon = mod.icon
            const isApplying = applying === mod.id
            const isApplied = applied.has(mod.id)
            return (
              <div key={mod.id}
                className="rounded-xl p-4 transition-all duration-300 group relative overflow-hidden gradient-border"
                style={{
                  background: isApplied ? 'rgba(74,222,128,0.03)' : 'rgba(255,255,255,0.02)',
                  animationDelay: `${idx * 30}ms`,
                }}>

                {/* Applied glow */}
                {isApplied && (
                  <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full pointer-events-none" style={{
                    background: 'radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)',
                  }} />
                )}

                <div className="relative" style={{ zIndex: 1 }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide" style={{
                      background: `${mod.color}12`,
                      color: mod.color,
                      border: `1px solid ${mod.color}18`,
                    }}>
                      {mod.tag}
                    </span>
                    {isApplied && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center success-pop" style={{
                        background: 'rgba(74,222,128,0.15)',
                        border: '1px solid rgba(74,222,128,0.2)',
                      }}>
                        <CheckCircle2 className="w-3 h-3" style={{ color: '#4ade80' }} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105" style={{
                      background: `${mod.color}10`,
                      border: `1px solid ${mod.color}15`,
                    }}>
                      {isApplying
                        ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: mod.color }} />
                        : <Icon className="w-4 h-4" style={{ color: mod.color }} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[11.5px] font-bold text-white truncate">{mod.name}</h3>
                      <p className="text-[9px] mt-0.5 leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.25)' }}>{mod.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold tracking-wide" style={{ color: mod.color }}>{mod.impact}</span>
                  </div>

                  <button onClick={() => handleApply(mod.id, mod.tweakId)} disabled={isApplying || isApplied}
                    className="w-full h-7.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all duration-300 disabled:opacity-40 btn-press ripple"
                    style={{
                      height: 30,
                      background: isApplied ? 'rgba(74,222,128,0.08)' : '#fff',
                      color: isApplied ? '#4ade80' : '#000',
                      border: isApplied ? '1px solid rgba(74,222,128,0.15)' : 'none',
                      boxShadow: isApplied ? 'none' : '0 2px 8px rgba(255,255,255,0.1)',
                    }}>
                    {isApplying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    {isApplying ? 'Applying...' : isApplied ? 'Applied' : 'Apply'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
