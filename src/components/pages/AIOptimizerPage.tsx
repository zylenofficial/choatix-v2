'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Bot, Cpu, Monitor, Zap, RotateCcw, CheckCircle, Loader2, Sparkles, Download, TrendingUp, Shield, AlertTriangle, ArrowRight, ChevronDown, ChevronRight, Gamepad2, Target, Crosshair, HardDrive, Wifi, MousePointer, MemoryStick, Gauge } from 'lucide-react'

interface Spec {
  cpu: string; cpuCores: number; cpuThreads: number; cpuClock: number; cpuUsage: number
  gpu: string; gpuVram: number; gpuVendor: string
  ramTotal: number; ramUsed: number
  powerPlan: string; gameMode: boolean | null
  networkLatency: number | null; mouseAccel: boolean
  bgProcesses: number; startupCount: number
  drives: { letter: string; sizeGB: number; freeGB: number }[]
  os: string
}

interface Fix {
  id: string
  title: string
  category: string
  before: string
  after: string
  fps: string
  fpsNum: [number, number]
  risk: string
  tweakId?: string
  why: string
  priority: number
}

const GAMES = [
  { id: 'fortnite', name: 'Fortnite', icon: '🎯', type: 'Battle Royale', est: (s: Spec) => estFps(s, 60, 40, 30, 15) },
  { id: 'valorant', name: 'Valorant', icon: '🔫', type: 'Tactical FPS', est: (s: Spec) => estFps(s, 120, 60, 30, 15) },
  { id: 'cs2', name: 'CS2', icon: '💣', type: 'Competitive', est: (s: Spec) => estFps(s, 150, 80, 40, 20) },
  { id: 'apex', name: 'Apex Legends', icon: '🪂', type: 'Battle Royale', est: (s: Spec) => estFps(s, 80, 40, 20, 10) },
  { id: 'warzone', name: 'Warzone', icon: '⚔️', type: 'Battle Royale', est: (s: Spec) => estFps(s, 50, 30, 25, 10) },
  { id: 'rocketleague', name: 'Rocket League', icon: '⚽', type: 'Sports', est: (s: Spec) => estFps(s, 200, 100, 50, 20) },
  { id: 'minecraft', name: 'Minecraft', icon: '⛏️', type: 'Sandbox', est: (s: Spec) => estFps(s, 80, 40, 30, 20) },
  { id: 'genshin', name: 'Genshin Impact', icon: '🗡️', type: 'RPG', est: (s: Spec) => estFps(s, 45, 25, 10, 5) },
]

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  System: <Shield className="w-3.5 h-3.5" />,
  Performance: <Gauge className="w-3.5 h-3.5" />,
  GPU: <Monitor className="w-3.5 h-3.5" />,
  CPU: <Cpu className="w-3.5 h-3.5" />,
  RAM: <MemoryStick className="w-3.5 h-3.5" />,
  Storage: <HardDrive className="w-3.5 h-3.5" />,
  Network: <Wifi className="w-3.5 h-3.5" />,
  Input: <MousePointer className="w-3.5 h-3.5" />,
  Hardware: <AlertTriangle className="w-3.5 h-3.5" />,
}

function estFps(s: Spec, base: number, cpuBonus: number, gpuBonus: number, ramBonus: number): [number, number] {
  let fps = base
  if (s.cpuCores >= 8) fps += cpuBonus
  else if (s.cpuCores >= 6) fps += Math.round(cpuBonus * 0.5)
  if (s.gpuVram >= 8) fps += gpuBonus
  else if (s.gpuVram >= 6) fps += Math.round(gpuBonus * 0.5)
  if (s.ramTotal >= 16) fps += ramBonus
  else if (s.ramTotal >= 8) fps += Math.round(ramBonus * 0.3)
  if (s.cpuClock >= 4500) fps += Math.round(cpuBonus * 0.3)
  return [Math.round(fps * 0.7), Math.round(fps * 1.3)]
}

function toSpec(data: any): Spec {
  const si = data?.systemInfo || {}
  return {
    cpu: si.cpu?.model || 'Unknown', cpuCores: si.cpu?.cores || 0, cpuThreads: si.cpu?.threads || 0,
    cpuClock: si.cpu?.maxClockMhz || 0, cpuUsage: si.cpu?.usage || 0,
    gpu: si.gpu?.model || 'Unknown', gpuVram: si.gpu?.vram || 0, gpuVendor: si.gpu?.vendor || '',
    ramTotal: si.ram?.total || 0, ramUsed: si.ram?.used || 0,
    powerPlan: si.powerPlan || 'Unknown', gameMode: si.gameMode,
    networkLatency: si.network?.latencyMs ?? null, mouseAccel: si.mouse?.enhancePointerPrecision || false,
    bgProcesses: si.processes?.background || 0, startupCount: si.startup?.count || 0,
    drives: si.disk?.drives || [], os: si.os?.version || 'Unknown',
  }
}

function generateFixes(s: Spec): Fix[] {
  const f: Fix[] = []
  let n = 0
  const gpu = s.gpu.toLowerCase()

  if (s.powerPlan !== 'High performance' && s.powerPlan !== 'Ultimate Performance') {
    f.push({ id: `${++n}`, title: 'Switch to High Performance power plan', category: 'System', before: s.powerPlan, after: 'High Performance', fps: '+5–15', fpsNum: [5, 15], risk: 'Safe', tweakId: 'sys-high-performance', why: 'Your CPU is being throttled by the current power plan. High Performance keeps max clock speeds.', priority: 10 })
  }
  if (s.gameMode === false) {
    f.push({ id: `${++n}`, title: 'Enable Windows Game Mode', category: 'System', before: 'Disabled', after: 'Enabled', fps: '+1–3', fpsNum: [1, 3], risk: 'Safe', tweakId: 'sys-enable-game-mode', why: 'Game Mode prioritizes your game and blocks Windows Update during gameplay.', priority: 6 })
  }
  f.push({ id: `${++n}`, title: 'Disable fullscreen optimizations', category: 'System', before: 'Enabled', after: 'Disabled', fps: '+1–4', fpsNum: [1, 4], risk: 'Safe', tweakId: 'sys-disable-fullscreen-opt', why: 'Windows overlay adds latency in fullscreen games. Disabling gives cleaner frame delivery.', priority: 7 })
  f.push({ id: `${++n}`, title: 'Set visual effects to Best Performance', category: 'System', before: 'Let Windows choose', after: 'Best Performance', fps: '+2–8', fpsNum: [2, 8], risk: 'Safe', tweakId: 'sys-visual-effects', why: 'Disables transparency, shadows, and animations. Frees GPU/CPU for your game.', priority: 8 })
  if (s.bgProcesses > 20) {
    f.push({ id: `${++n}`, title: `Remove bloatware apps (Bing Weather, News, Sports)`, category: 'Performance', before: 'Installed', after: 'Removed', fps: '+2–8', fpsNum: [2, 8], risk: 'Safe', tweakId: 'debloat-remove-background', why: `You have ${s.bgProcesses} background processes. Removing unused bloatware apps frees RAM and CPU.`, priority: 9 })
  }
  if (s.startupCount > 5) {
    f.push({ id: `${++n}`, title: `Disable ${s.startupCount} startup programs`, category: 'Performance', before: `${s.startupCount} programs`, after: '< 5', fps: '+2–8', fpsNum: [2, 8], risk: 'Safe', tweakId: 'debloat-disable-startup', why: 'Too many startup programs slow your PC and waste RAM.', priority: 5 })
  }
  f.push({ id: `${++n}`, title: 'Disable SysMain (Superfetch)', category: 'Performance', before: 'Running', after: 'Disabled', fps: '+2–6', fpsNum: [2, 6], risk: 'Safe', tweakId: 'debloat-superfetch', why: 'Superfetch preloads apps into RAM, competing with games for memory.', priority: 4 })
  if (gpu.includes('nvidia') || gpu.includes('geforce') || gpu.includes('rtx') || gpu.includes('gtx')) {
    f.push({ id: `${++n}`, title: 'Set GPU power to Maximum Performance', category: 'GPU', before: 'Optimal Power', after: 'Max Performance', fps: '+3–12', fpsNum: [3, 12], risk: 'Safe', tweakId: 'nv-max-power', why: 'GPU drops clock speed to save power. Max Performance keeps it at peak during gaming.', priority: 9 })
    f.push({ id: `${++n}`, title: 'Disable driver V-Sync', category: 'GPU', before: 'Enabled', after: 'Off', fps: '+1–5', fpsNum: [1, 5], risk: 'Safe', tweakId: 'nv-disable-vsync', why: 'Driver V-Sync adds input lag. Use G-Sync or in-game V-Sync instead.', priority: 6 })
    f.push({ id: `${++n}`, title: 'Enable Low Latency Mode', category: 'GPU', before: 'Off', after: 'On', fps: '+0–2', fpsNum: [0, 2], risk: 'Safe', tweakId: 'nv-low-latency', why: 'Reduces render queue to minimum frames. Less input lag.', priority: 5 })
    f.push({ id: `${++n}`, title: 'Set texture filtering to Performance', category: 'GPU', before: 'Quality', after: 'Performance', fps: '+2–6', fpsNum: [2, 6], risk: 'Safe', tweakId: 'nv-texture-filtering', why: 'Reduces anisotropic filtering. Almost no visual difference, small FPS boost.', priority: 4 })
  }
  if (gpu.includes('radeon') || gpu.includes('rx') || gpu.includes('amd')) {
    f.push({ id: `${++n}`, title: 'Disable Radeon Chill', category: 'GPU', before: 'Unknown', after: 'Off', fps: '+5–20', fpsNum: [5, 20], risk: 'Safe', why: 'Radeon Chill caps FPS to save power. Turn it off for maximum performance.', priority: 8 })
    f.push({ id: `${++n}`, title: 'Enable Radeon Anti-Lag', category: 'GPU', before: 'Unknown', after: 'On', fps: '+0–3', fpsNum: [0, 3], risk: 'Safe', why: 'Reduces CPU-GPU frame pacing delay.', priority: 5 })
  }
  f.push({ id: `${++n}`, title: 'Disable CPU core parking', category: 'CPU', before: 'Some parked', after: 'All cores active', fps: '+3–12', fpsNum: [3, 12], risk: 'Safe', tweakId: 'cpu-core-parking-disable', why: 'Parked cores cannot process game threads. Unparking gives full CPU power.', priority: 8 })
  f.push({ id: `${++n}`, title: 'Set game to High CPU priority', category: 'CPU', before: 'Normal', after: 'High', fps: '+3–10', fpsNum: [3, 10], risk: 'Low', tweakId: 'sys-cpu-priority', why: 'Game gets CPU time before background processes.', priority: 7 })
  f.push({ id: `${++n}`, title: 'Clean stale memory pages', category: 'RAM', before: 'Idle pages', after: 'Cleaned', fps: '+2–8', fpsNum: [2, 8], risk: 'Safe', tweakId: 'memory-wake-cleaner', why: 'Frees unused RAM pages so your game has more memory available.', priority: 5 })
  if (s.ramTotal <= 8) {
    f.push({ id: `${++n}`, title: 'Optimize page file for low RAM', category: 'RAM', before: 'System Managed', after: '1.5x RAM', fps: '+3–10', fpsNum: [3, 10], risk: 'Low', tweakId: 'memory-pagefile-manager', why: `Only ${s.ramTotal}GB RAM. Proper page file prevents crashes.`, priority: 7 })
  }
  f.push({ id: `${++n}`, title: 'Enable SSD TRIM', category: 'Storage', before: 'Unknown', after: 'Enabled', fps: '+0–2', fpsNum: [0, 2], risk: 'Safe', tweakId: 'storage-trim-optimization', why: 'Keeps your SSD fast over time.', priority: 2 })
  f.push({ id: `${++n}`, title: 'Enable write cache', category: 'Storage', before: 'Unknown', after: 'Enabled', fps: '+1–4', fpsNum: [1, 4], risk: 'Safe', tweakId: 'storage-write-cache', why: 'Buffers disk writes in RAM. Reduces I/O stutter.', priority: 3 })
  f.push({ id: `${++n}`, title: 'Optimize DNS servers', category: 'Network', before: 'ISP default', after: 'Cloudflare/Google', fps: 'Ping only', fpsNum: [0, 0], risk: 'Safe', tweakId: 'net-optimize-dns', why: 'Faster DNS = faster game server connections.', priority: 3 })
  f.push({ id: `${++n}`, title: 'Block background updates while gaming', category: 'Network', before: 'Enabled', after: 'Disabled', fps: 'Ping only', fpsNum: [0, 0], risk: 'Safe', tweakId: 'net-disable-background-updates', why: 'Windows Update steals bandwidth during matches.', priority: 4 })
  if (s.networkLatency && s.networkLatency > 30) {
    f.push({ id: `${++n}`, title: `Network latency is ${s.networkLatency}ms (should be < 20ms)`, category: 'Network', before: `${s.networkLatency}ms`, after: '< 20ms', fps: 'Ping only', fpsNum: [0, 0], risk: 'Info', why: 'Use Ethernet cable instead of WiFi. Close bandwidth-heavy apps.', priority: 7 })
  }
  if (s.mouseAccel) {
    f.push({ id: `${++n}`, title: 'Disable mouse acceleration', category: 'Input', before: 'ON', after: 'OFF', fps: 'Aim fix', fpsNum: [0, 0], risk: 'Safe', tweakId: 'mouse-disable-acceleration', why: 'Mouse acceleration makes aiming inconsistent. Raw input gives 1:1 movement.', priority: 7 })
  }
  f.push({ id: `${++n}`, title: 'Force raw mouse input', category: 'Input', before: 'Default', after: 'Raw Input ON', fps: 'Aim fix', fpsNum: [0, 0], risk: 'Safe', tweakId: 'mouse-raw-input', why: 'Bypasses Windows mouse processing for lowest input lag.', priority: 5 })
  if (s.ramTotal < 8) {
    f.push({ id: `${++n}`, title: `Only ${s.ramTotal}GB RAM — UPGRADE NEEDED`, category: 'Hardware', before: `${s.ramTotal}GB`, after: '16GB minimum', fps: '+10–30', fpsNum: [10, 30], risk: 'Info', why: 'Modern games need 16GB RAM. This is your biggest bottleneck.', priority: 10 })
  } else if (s.ramTotal < 16) {
    f.push({ id: `${++n}`, title: `${s.ramTotal}GB RAM — consider upgrading to 16GB`, category: 'Hardware', before: `${s.ramTotal}GB`, after: '16GB', fps: '+5–15', fpsNum: [5, 15], risk: 'Info', why: '16GB is the sweet spot for gaming in 2026.', priority: 4 })
  }
  if (s.gpuVram > 0 && s.gpuVram < 4) {
    f.push({ id: `${++n}`, title: `Only ${s.gpuVram}GB VRAM — UPGRADE NEEDED`, category: 'Hardware', before: `${s.gpuVram}GB`, after: '6GB+ minimum', fps: '+15–40', fpsNum: [15, 40], risk: 'Info', why: 'Many modern games need 6GB+ VRAM. This causes texture issues.', priority: 10 })
  }

  return f.sort((a, b) => b.priority - a.priority)
}

const SCAN_STEPS = [
  'Detecting CPU...',
  'Scanning GPU...',
  'Checking RAM...',
  'Reading drives...',
  'Testing network...',
  'Analyzing processes...',
  'Checking power settings...',
  'Reading peripherals...',
]

export function AIOptimizerPage() {
  const [spec, setSpec] = useState<Spec | null>(null)
  const [scanning, setScanning] = useState(false)
  const [game, setGame] = useState<string>('')
  const [fixes, setFixes] = useState<Fix[] | null>(null)
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'analyzing' | 'done'>('idle')
  const [scanStep, setScanStep] = useState(0)
  const [scanProgress, setScanProgress] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const detect = useCallback(async () => {
    if (!window.electronAPI) return
    setPhase('scanning'); setScanning(true); setScanStep(0); setScanProgress(0)

    let stepIdx = 0
    progressRef.current = setInterval(() => {
      setScanProgress(p => Math.min(p + 8 + Math.random() * 6, 92))
      if (stepIdx < SCAN_STEPS.length - 1) {
        stepIdx++
        setScanStep(stepIdx)
      }
    }, 300)

    try {
      const data = await window.electronAPI.advisorScan()
      setSpec(toSpec(data))
    } catch {}

    if (progressRef.current) clearInterval(progressRef.current)
    setScanProgress(100)
    setTimeout(() => { setScanning(false); setPhase('idle') }, 400)
  }, [])

  useEffect(() => { detect() }, [detect])
  useEffect(() => { return () => { if (progressRef.current) clearInterval(progressRef.current) } }, [])

  const selectedGame = useMemo(() => GAMES.find(g => g.id === game), [game])

  const analyze = () => {
    if (!spec) return
    setPhase('analyzing'); setShowResults(false)
    setTimeout(() => {
      const f = generateFixes(spec)
      setFixes(f)
      setPhase('done')
      if (f.length > 0) setOpenCat(f[0].category)
      setTimeout(() => setShowResults(true), 50)
    }, 1400)
  }

  const applyFix = async (tweakId: string) => {
    if (!window.electronAPI?.applyTweak) return
    try { await window.electronAPI.applyTweak(tweakId); setDone(p => new Set(p).add(tweakId)) } catch {}
  }

  const applyAll = async () => {
    if (!fixes) return
    for (const fix of fixes) {
      if (fix.tweakId && fix.risk === 'Safe' && !done.has(fix.tweakId)) {
        await applyFix(fix.tweakId)
      }
    }
  }

  const cats = useMemo(() => {
    if (!fixes) return {}
    const g: Record<string, Fix[]> = {}
    fixes.forEach(f => { if (!g[f.category]) g[f.category] = []; g[f.category].push(f) })
    return g
  }, [fixes])

  const totalFps = useMemo(() => {
    if (!fixes) return [0, 0] as [number, number]
    return fixes.reduce<[number, number]>((acc, f) => [acc[0] + f.fpsNum[0], acc[1] + f.fpsNum[1]], [0, 0])
  }, [fixes])

  const score = useMemo(() => {
    if (!spec) return 0
    let s = 30
    if (spec.powerPlan === 'High performance' || spec.powerPlan === 'Ultimate Performance') s += 12
    if (spec.gameMode) s += 6
    if (spec.cpuCores >= 8) s += 12
    else if (spec.cpuCores >= 6) s += 6
    if (spec.ramTotal >= 16) s += 12
    else if (spec.ramTotal >= 8) s += 6
    if (spec.gpuVram >= 8) s += 12
    else if (spec.gpuVram >= 4) s += 6
    if (!spec.mouseAccel) s += 5
    if (spec.bgProcesses < 30) s += 5
    if (spec.networkLatency && spec.networkLatency < 20) s += 5
    return Math.min(s, 100)
  }, [spec])

  const scoreColor = score >= 80 ? '#ffffff' : score >= 50 ? '#cccccc' : '#999999'
  const scoreLabel = score >= 80 ? 'Optimized' : score >= 50 ? 'Good' : 'Needs Work'

  const exportReport = () => {
    if (!fixes || !spec) return
    let r = `CHOATIX AI FPS OPTIMIZER REPORT\n${'='.repeat(40)}\n\n`
    r += `CPU: ${spec.cpu} (${spec.cpuCores}C/${spec.cpuThreads}T)\nGPU: ${spec.gpu} (${spec.gpuVram}GB)\nRAM: ${spec.ramTotal}GB\n`
    r += `Power: ${spec.powerPlan} | Game Mode: ${spec.gameMode ? 'On' : 'Off'}\n`
    r += `Score: ${score}/100 | Potential: +${totalFps[0]}–${totalFps[1]} FPS\n\n`
    r += `FIXES (${fixes.length}):\n${'-'.repeat(30)}\n`
    fixes.forEach(f => { r += `\n[${f.category}] ${f.title}\n  ${f.before} → ${f.after}\n  FPS: ${f.fps} | Risk: ${f.risk}\n  ${f.why}\n` })
    const b = new Blob([r], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b); a.download = `choatix-report-${Date.now()}.txt`; a.click()
  }

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
                <Bot className="w-6 h-6 text-black" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#333', border: '2px solid #000' }}>
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">AI FPS Optimizer</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Scan your system → Identify bottlenecks → Maximize FPS</p>
            </div>
          </div>
          {fixes && (
            <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-white transition-all" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <Download className="w-3.5 h-3.5" /> Export Report
            </button>
          )}
        </div>

        {/* ─── SCANNING STATE ─── */}
        {(phase === 'scanning' || phase === 'analyzing') && (
          <div className="fade-in-scale">
            <div className="rounded-3xl p-10 flex flex-col items-center gap-8" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              {/* Animated scan icon */}
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center pulse-glow" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                  {phase === 'scanning' ? (
                    <Cpu className="w-10 h-10 text-white scan-pulse" />
                  ) : (
                    <Sparkles className="w-10 h-10 text-white scan-pulse" />
                  )}
                </div>
                {/* Orbiting dots */}
                {[0, 1, 2].map(i => (
                  <div key={i} className="absolute inset-0" style={{ animation: `spin ${2 + i * 0.5}s linear infinite ${i === 1 ? 'reverse' : ''}` }}>
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-white/30" style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }} />
                  </div>
                ))}
              </div>

              <div className="text-center space-y-2">
                <div className="text-base font-semibold text-white">
                  {phase === 'scanning' ? 'Scanning your hardware' : 'Analyzing optimizations'}
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {phase === 'scanning' ? SCAN_STEPS[scanStep] : 'Finding the best tweaks for your system...'}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-72 progress-bar progress-bar-glow" style={{ '--bar-color': '#fff' } as any}>
                <div className="fill" style={{ width: `${scanProgress}%`, background: '#fff' }} />
              </div>

              {/* Step indicators */}
              {phase === 'scanning' && (
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {SCAN_STEPS.map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-300"
                      style={{ background: i <= scanStep ? 'rgba(255,255,255,0.08)' : 'transparent', color: i <= scanStep ? '#fff' : 'var(--text-muted)' }}>
                      {i < scanStep ? <CheckCircle className="w-2.5 h-2.5" /> : i === scanStep ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)' }} />}
                      {step}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── IDLE: SPEC OVERVIEW (post-scan, pre-analyze) ─── */}
        {spec && phase === 'idle' && !fixes && (
          <div className="space-y-5 fade-in">

            {/* Score Ring + Hardware */}
            <div className="grid grid-cols-12 gap-4">
              {/* Score Ring */}
              <div className="col-span-3 rounded-3xl p-6 flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${score * 3.267} ${326.7 - score * 3.267}`}
                      style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-black text-white">{score}</div>
                    <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-medium">/ 100</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: scoreColor }}>{scoreLabel}</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">System Health</div>
                </div>
              </div>

              {/* Hardware Cards */}
              <div className="col-span-9 grid grid-cols-3 gap-4">
                {[
                  { label: 'Processor', icon: <Cpu className="w-4 h-4" />, name: spec.cpu, sub: `${spec.cpuCores}C / ${spec.cpuThreads}T • ${spec.cpuClock}MHz`, usage: spec.cpuUsage },
                  { label: 'Graphics', icon: <Monitor className="w-4 h-4" />, name: spec.gpu, sub: `${spec.gpuVram}GB VRAM • ${spec.gpuVendor}`, usage: null },
                  { label: 'Memory', icon: <MemoryStick className="w-4 h-4" />, name: `${spec.ramTotal} GB`, sub: `${Math.round(spec.ramUsed)}GB used • ${spec.bgProcesses} bg processes`, usage: (spec.ramUsed / spec.ramTotal) * 100 },
                ].map((item, i) => (
                  <div key={i} className="card-widget p-5 flex flex-col justify-between" style={{ animationDelay: `${i * 80}ms` }}>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                          {item.icon}
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-medium">{item.label}</div>
                      </div>
                      <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                      <div className="text-[11px] text-[var(--text-tertiary)] mt-1">{item.sub}</div>
                    </div>
                    {item.usage !== null && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] uppercase text-[var(--text-muted)]">Usage</span>
                          <span className="text-[10px] font-bold text-white">{Math.round(item.usage)}%</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(item.usage, 100)}%`, background: item.usage > 80 ? 'var(--danger)' : item.usage > 50 ? 'var(--warning)' : '#fff' }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Status Row */}
            <div className="grid grid-cols-4 gap-3 stagger">
              {[
                { icon: <Zap className="w-3.5 h-3.5" />, label: 'Power Plan', value: spec.powerPlan, ok: spec.powerPlan === 'High performance' || spec.powerPlan === 'Ultimate Performance' },
                { icon: <Gamepad2 className="w-3.5 h-3.5" />, label: 'Game Mode', value: spec.gameMode ? 'Active' : 'Inactive', ok: !!spec.gameMode },
                { icon: <MousePointer className="w-3.5 h-3.5" />, label: 'Mouse Input', value: spec.mouseAccel ? 'Acceleration' : 'Raw', ok: !spec.mouseAccel },
                { icon: <Wifi className="w-3.5 h-3.5" />, label: 'Network Ping', value: spec.networkLatency ? `${spec.networkLatency}ms` : 'N/A', ok: !spec.networkLatency || spec.networkLatency < 20 },
              ].map((stat, i) => (
                <div key={i} className="card-widget p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: stat.ok ? 'rgba(255,255,255,0.06)' : 'rgba(153,153,153,0.06)', color: stat.ok ? '#fff' : '#999' }}>
                    {stat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-medium">{stat.label}</div>
                    <div className="text-xs font-semibold text-white truncate mt-0.5">{stat.value}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: stat.ok ? '#fff' : '#666', boxShadow: stat.ok ? '0 0 8px rgba(255,255,255,0.3)' : 'none' }} />
                </div>
              ))}
            </div>

            {/* Game Picker */}
            <div className="rounded-3xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-[var(--text-tertiary)]" />
                <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-medium">Choose a game for estimated FPS</div>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {GAMES.map(g => (
                  <button key={g.id} onClick={() => setGame(game === g.id ? '' : g.id)}
                    className="group relative p-3.5 rounded-2xl text-left transition-all duration-200"
                    style={{
                      background: game === g.id ? 'rgba(255,255,255,0.08)' : 'var(--bg-tertiary)',
                      border: `1px solid ${game === g.id ? 'rgba(255,255,255,0.2)' : 'var(--border-subtle)'}`,
                    }}>
                    <div className="text-lg mb-1.5">{g.icon}</div>
                    <div className="text-xs font-semibold text-white">{g.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{g.type}</div>
                  </button>
                ))}
              </div>
              {selectedGame && spec && (
                <div className="mt-4 p-4 rounded-2xl flex items-center justify-between" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{selectedGame.icon}</div>
                    <div>
                      <div className="text-sm font-bold text-white">{selectedGame.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{selectedGame.type} • Estimated FPS</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-white">{selectedGame.est(spec)[0]}–{selectedGame.est(spec)[1]}</div>
                    <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">FPS</div>
                  </div>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            <button onClick={analyze} className="w-full py-5 rounded-2xl text-sm font-bold text-black flex items-center justify-center gap-2.5 btn-primary hover-lift">
              <Sparkles className="w-4 h-4" /> Analyze & Generate Optimizations
            </button>
          </div>
        )}

        {/* ─── RESULTS ─── */}
        {fixes && (
          <div className={`space-y-5 ${showResults ? 'fade-in' : 'opacity-0'}`}>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3 stagger">
              <div className="card-widget p-5 text-center">
                <div className="text-2xl font-black text-white count-animate">+{totalFps[0]}–{totalFps[1]}</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1.5 font-medium">Potential FPS</div>
              </div>
              <div className="card-widget p-5 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="text-2xl font-black text-white count-animate">{score}</div>
                  <span className="text-sm text-[var(--text-muted)]">/100</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1.5 font-medium">Your Score</div>
              </div>
              <div className="card-widget p-5 text-center">
                <div className="text-2xl font-black text-white count-animate">{fixes.length}</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1.5 font-medium">Optimizations</div>
              </div>
              <div className="card-widget p-5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="text-2xl font-black text-white count-animate">{done.size}</div>
                  <span className="text-sm text-[var(--text-muted)]">/ {fixes.length}</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1.5 font-medium">Applied</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-3">
                <button onClick={applyAll} className="px-6 py-2.5 rounded-xl text-xs font-bold text-black btn-primary">
                  <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Apply All Safe</span>
                </button>
                <div className="h-5 w-px" style={{ background: 'var(--border-subtle)' }} />
                <div className="text-[10px] text-[var(--text-muted)]">{fixes.filter(f => f.risk === 'Safe').length} safe tweaks available</div>
              </div>
              <button onClick={() => { setFixes(null); setGame(''); setDone(new Set()); setPhase('idle'); setShowResults(false) }}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-white flex items-center gap-1.5 transition-colors"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                <RotateCcw className="w-3 h-3" /> Re-analyze
              </button>
            </div>

            {/* Category Groups */}
            <div className="space-y-3">
              {Object.entries(cats).map(([cat, catFixes], catIdx) => {
                const catDone = catFixes.filter(f => f.tweakId && done.has(f.tweakId)).length
                const catFps = catFixes.reduce<[number, number]>((a, f) => [a[0] + f.fpsNum[0], a[1] + f.fpsNum[1]], [0, 0])
                const isOpen = openCat === cat
                const allDone = catDone === catFixes.length

                return (
                  <div key={cat} className="rounded-2xl overflow-hidden transition-all duration-300" style={{ background: 'var(--bg-secondary)', border: `1px solid ${isOpen ? 'var(--border-default)' : 'var(--border-subtle)'}` }}>
                    <button onClick={() => setOpenCat(isOpen ? null : cat)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                          {CATEGORY_ICONS[cat] || <Shield className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{cat}</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {catDone}/{catFixes.length} applied
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {(catFps[0] > 0 || catFps[1] > 0) && (
                          <div className="px-3 py-1 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                            +{catFps[0]}–{catFps[1]} FPS
                          </div>
                        )}
                        {allDone && (
                          <CheckCircle className="w-4 h-4 text-[var(--text-tertiary)]" />
                        )}
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-5 space-y-2.5 stagger">
                        {catFixes.map(fix => {
                          const isDone = !!fix.tweakId && done.has(fix.tweakId)
                          return (
                            <div key={fix.id} className="group p-5 rounded-xl transition-all duration-300" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', opacity: isDone ? 0.5 : 1 }}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-semibold text-white">{fix.title}</div>
                                    {isDone && <CheckCircle className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />}
                                  </div>
                                  <div className="text-xs text-[var(--text-tertiary)] mt-1.5 leading-relaxed">{fix.why}</div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                  <span className="text-[10px] px-2.5 py-1 rounded-lg font-semibold"
                                    style={{
                                      background: fix.risk === 'Safe' ? 'rgba(255,255,255,0.06)' : fix.risk === 'Low' ? 'rgba(200,200,200,0.04)' : 'rgba(153,153,153,0.04)',
                                      color: fix.risk === 'Safe' ? '#fff' : fix.risk === 'Low' ? '#ccc' : '#999',
                                    }}>
                                    {fix.risk}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                  {/* Before */}
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="w-24 h-1 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
                                    <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">Before</div>
                                    <div className="text-[11px] text-[var(--text-tertiary)] font-medium">{fix.before}</div>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                                  {/* After */}
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="w-24 h-1 rounded-full" style={{ background: '#fff' }} />
                                    <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">After</div>
                                    <div className="text-[11px] text-white font-semibold">{fix.after}</div>
                                  </div>
                                  {/* FPS */}
                                  <div className="ml-2 flex flex-col items-center gap-1">
                                    <div className="w-24 h-1 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
                                    <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">FPS Gain</div>
                                    <div className="text-[11px] font-bold text-white">{fix.fps}</div>
                                  </div>
                                </div>

                                {fix.tweakId && (
                                  <button onClick={() => applyFix(fix.tweakId!)} disabled={isDone}
                                    className="px-5 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 hover-lift"
                                    style={{
                                      background: isDone ? 'var(--bg-elevated)' : '#fff',
                                      color: isDone ? 'var(--text-muted)' : '#000',
                                      cursor: isDone ? 'default' : 'pointer',
                                    }}>
                                    {isDone ? '✓ Applied' : 'Apply'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
