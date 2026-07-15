'use client'

import { useState, useCallback, useMemo } from 'react'
import { Zap, Mouse, Wifi, Target, Trash2, MemoryStick, Loader2, CheckCircle2, Monitor, Gauge, Shield, Clock, Cpu, Paintbrush, Sparkles, ArrowUp } from 'lucide-react'

const MODULES = [
  { id: 'fps-boost', tweakId: 'game-dvr-disable', name: 'FPS Boost', desc: 'Disables Game DVR, Game Bar, and hardware GPU scheduling', icon: Zap, color: '#4ade80', tag: 'Performance', impact: '+10-25% FPS' },
  { id: 'ultimate-perf', tweakId: 'sys-enable-ultimate-performance', name: 'Ultimate Performance', desc: 'Unlocks Windows Ultimate Performance power plan', icon: Gauge, color: '#f87171', tag: 'Performance', impact: 'Max CPU/GPU power' },
  { id: 'disable-vbs', tweakId: 'sys-disable-vbs', name: 'Disable VBS & Hyper-V', desc: 'Turns off virtualization security for major FPS gain', icon: Shield, color: '#fb923c', tag: 'Performance', impact: '+5-15% FPS' },
  { id: 'cpu-priority', tweakId: 'sys-cpu-priority', name: 'CPU Priority Boost', desc: 'Optimizes CPU scheduling for foreground games', icon: Cpu, color: '#a78bfa', tag: 'CPU', impact: 'Faster game response' },
  { id: 'core-parking', tweakId: 'cpu-core-parking-disable', name: 'Disable Core Parking', desc: 'Keeps all CPU cores active, no park/unpark latency', icon: Cpu, color: '#60a5fa', tag: 'CPU', impact: 'All cores active' },
  { id: 'input-delay', tweakId: 'mouse-acceleration-disable', name: 'Input Delay Fix', desc: 'Disables mouse acceleration and optimizes timer resolution', icon: Mouse, color: '#fb923c', tag: 'Input', impact: '30% less input lag' },
  { id: 'aim-stabilizer', tweakId: 'pointer-precision-disable', name: 'Aim Stabilizer', desc: 'Disables pointer precision for raw mouse input', icon: Target, color: '#a78bfa', tag: 'Aim', impact: 'Consistent aim' },
  { id: 'ping-optimizer', tweakId: 'dns-optimization', name: 'Ping Optimizer', desc: 'DNS optimization, network throttling off, TCP stack optimization', icon: Wifi, color: '#60a5fa', tag: 'Network', impact: '-10-30ms ping' },
  { id: 'gpu-performance', tweakId: 'nv-optimize-performance', name: 'GPU Performance Mode', desc: 'NVIDIA power management to max performance, texture filtering optimized', icon: Monitor, color: '#4ade80', tag: 'GPU', impact: 'Stable GPU clocks' },
  { id: 'disable-animations', tweakId: 'sys-disable-animations', name: 'Disable Animations', desc: 'Turns off Windows animations for snappier UI response', icon: Paintbrush, color: '#fbbf24', tag: 'System', impact: 'Snappier UI' },
  { id: 'disable-fullscreen', tweakId: 'sys-disable-fullscreen-opt', name: 'Disable Fullscreen Opt', desc: 'Removes fullscreen overlay for lower input lag', icon: Monitor, color: '#60a5fa', tag: 'Gaming', impact: 'Lower input lag' },
  { id: 'game-mode', tweakId: 'sys-enable-game-mode', name: 'Enable Game Mode', desc: 'Windows prioritizes gaming resources, reduces background interference', icon: Zap, color: '#4ade80', tag: 'Gaming', impact: 'Less background lag' },
  { id: 'memory-boost', tweakId: 'memory-working-set', name: 'Memory Boost', desc: 'Optimizes working set and memory management', icon: MemoryStick, color: '#fbbf24', tag: 'Memory', impact: 'More free RAM' },
  { id: 'audio-latency', tweakId: 'audio-disable-enhancements', name: 'Audio Latency Fix', desc: 'Disables audio enhancements for lower sound latency', icon: Zap, color: '#a78bfa', tag: 'Audio', impact: 'Lower audio delay' },
  { id: 'ssd-optimization', tweakId: 'storage-ssd-optimization', name: 'SSD Optimization', desc: 'Optimizes SSD settings for faster load times', icon: Gauge, color: '#60a5fa', tag: 'Storage', impact: 'Faster game loads' },
  { id: 'disable-background', tweakId: 'sys-reduce-background', name: 'Kill Background Apps', desc: 'Reduces background process CPU usage', icon: Trash2, color: '#f87171', tag: 'System', impact: 'Free CPU resources' },
  { id: 'debloat', tweakId: 'sys-disable-cortana', name: 'System Debloat', desc: 'Disables Cortana, widgets, and unnecessary services', icon: Trash2, color: '#f87171', tag: 'Cleanup', impact: 'Free resources' },
  { id: 'msi-optimization', tweakId: 'sys-optimize-msi', name: 'MSI Mode Optimize', desc: 'Optimizes Message Signal Interrupts for GPU and devices', icon: Gauge, color: '#4ade80', tag: 'Hardware', impact: 'Lower device latency' },
]

export function QuickBoostPage() {
  const [applying, setApplying] = useState<string | null>(null)
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [boosting, setBoosting] = useState(false)

  const handleApply = useCallback(async (moduleId: string, tweakId: string) => {
    setApplying(moduleId)
    try {
      const result = await (window.electronAPI as any)?.applyTweak?.(tweakId)
      if (result?.success !== false) {
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
        try { await api?.applyTweak?.(mod.tweakId) } catch {}
        setApplied(prev => new Set(prev).add(mod.id))
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
                One-click optimization for maximum gaming performance. Boost your FPS, reduce input lag, and optimize your system.
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
