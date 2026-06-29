'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Bot, Cpu, Monitor, Zap, ChevronRight, ChevronDown, Search, RotateCcw, CheckCircle, AlertTriangle, Gamepad2, Settings, Shield, Loader2, Sparkles } from 'lucide-react'

interface SystemSpec {
  cpuModel: string
  cpuCores: number
  cpuThreads: number
  cpuMaxClock: number
  gpuModel: string
  gpuVram: number
  gpuVendor: string
  ramTotal: number
  diskDrives: { letter: string; sizeGB: number; freeGB: number }[]
  osVersion: string
  osBuild: string
  powerPlan: string
  gameMode: boolean | null
  networkLatency: number | null
  mouseAccel: boolean
  startupCount: number
  bgProcesses: number
}

interface Rec {
  category: string
  setting: string
  current: string
  recommended: string
  reason: string
  fpsGain: [number, number]
  risk: 'None' | 'Low' | 'Medium' | 'High'
  reversible: boolean
  tweakId?: string
  advanced?: boolean
}

interface GameProfile {
  id: string
  name: string
  exe: string
  gpuIntensive: boolean
  cpuIntensive: boolean
  esports: boolean
  recommended: {
    renderScale: string
    shadows: string
    textures: string
    effects: string
    postProcess: string
    aa: string
    rt: string
    vsync: string
    motionBlur: string
    dlssFsr: string
  }
  launchOptions: string
  settingsSummary: string
}

const GAMES: GameProfile[] = [
  {
    id: 'fortnite', name: 'Fortnite', exe: 'FortniteClient-Win64-Shipping.exe',
    gpuIntensive: true, cpuIntensive: true, esports: false,
    recommended: { renderScale: '100%', shadows: 'Medium', textures: 'High', effects: 'Low', postProcess: 'Low', aa: 'Off', rt: 'Off', vsync: 'Off', motionBlur: 'Off', dlssFsr: 'Performance' },
    launchOptions: '-USEALLAVAILABLECORES -dx12 -NOSPLASH',
    settingsSummary: 'Low settings + DLSS Performance for max FPS. Medium shadows for visibility.',
  },
  {
    id: 'valorant', name: 'Valorant', exe: 'VALORANT-Win64-Shipping.exe',
    gpuIntensive: false, cpuIntensive: true, esports: true,
    recommended: { renderScale: '100%', shadows: 'Low', textures: 'Med', effects: 'Low', postProcess: 'Low', aa: 'MSAA 2x', rt: 'Off', vsync: 'Off', motionBlur: 'Off', dlssFsr: 'Off' },
    launchOptions: '',
    settingsSummary: 'Low settings + MSAA for clarity. CPU-bound game — optimize CPU priority.',
  },
  {
    id: 'cs2', name: 'Counter-Strike 2', exe: 'cs2.exe',
    gpuIntensive: false, cpuIntensive: true, esports: true,
    recommended: { renderScale: '100%', shadows: 'Medium', textures: 'High', effects: 'Low', postProcess: 'Low', aa: 'MSAA 4x', rt: 'Off', vsync: 'Off', motionBlur: 'Off', dlssFsr: 'Off' },
    launchOptions: '-novid -high -threads 0',
    settingsSummary: 'Competitive settings. Medium shadows for visibility. MSAA for clarity.',
  },
  {
    id: 'apex', name: 'Apex Legends', exe: 'r5apex.exe',
    gpuIntensive: true, cpuIntensive: false, esports: true,
    recommended: { renderScale: '100%', shadows: 'Low', textures: 'High', effects: 'Low', postProcess: 'Low', aa: 'TSAA', rt: 'Off', vsync: 'Off', motionBlur: 'Off', dlssFsr: 'Quality' },
    launchOptions: '+fps_max 0 -high',
    settingsSummary: 'Low everything except textures. DLSS Quality if NVIDIA.',
  },
  {
    id: 'warzone', name: 'Warzone / MW3', exe: 'ModernWarfare.exe',
    gpuIntensive: true, cpuIntensive: true, esports: false,
    recommended: { renderScale: '90%', shadows: 'Low', textures: 'Normal', effects: 'Low', postProcess: 'Low', aa: 'Off', rt: 'Off', vsync: 'Off', motionBlur: 'Off', dlssFsr: 'Performance' },
    launchOptions: '',
    settingsSummary: '90% render scale + DLSS Performance. Low everything else.',
  },
  {
    id: 'rocketleague', name: 'Rocket League', exe: 'RocketLeague.exe',
    gpuIntensive: false, cpuIntensive: false, esports: false,
    recommended: { renderScale: '100%', shadows: 'High', textures: 'High', effects: 'Quality', postProcess: 'Performance', aa: 'Off', rt: 'Off', vsync: 'Off', motionBlur: 'Off', dlssFsr: 'Off' },
    launchOptions: '',
    settingsSummary: 'Performance qualities. Game runs well on most hardware.',
  },
  {
    id: 'minecraft', name: 'Minecraft', exe: 'javaw.exe',
    gpuIntensive: false, cpuIntensive: true, esports: false,
    recommended: { renderScale: '100%', shadows: 'Fancy', textures: 'Default', effects: 'Fancy', postProcess: 'N/A', aa: 'Off', rt: 'Off', vsync: 'Off', motionBlur: 'Off', dlssFsr: 'Off' },
    launchOptions: '-Xmx4G -XX:+UseG1GC -XX:+UnlockExperimentalVMOptions',
    settingsSummary: 'Java: allocate 4GB+ RAM. Use Sodium mod for 2-3x FPS boost.',
  },
  {
    id: 'genshin', name: 'Genshin Impact', exe: 'GenshinImpact.exe',
    gpuIntensive: true, cpuIntensive: false, esports: false,
    recommended: { renderScale: '1.0', shadows: 'Low', textures: 'High', effects: 'Low', postProcess: 'Low', aa: 'Off', rt: 'Off', vsync: 'Off', motionBlur: 'Off', dlssFsr: 'Off' },
    launchOptions: '',
    settingsSummary: 'Low shadows/effects, high textures. Game is GPU-limited.',
  },
]

const catIcons: Record<string, string> = {
  'Power Plan': '⚡', 'Windows': '🪟', 'Background Apps': '📱', 'Startup': '🚀',
  'NVIDIA': '🟢', 'AMD': '🔴', 'CPU': '🧠', 'GPU': '🎮', 'RAM': '💾',
  'Storage': '💿', 'Network': '🌐', 'BIOS': '⚙️', 'Advanced': '🔬',
  'Game Settings': '🖼', 'Game Launch': '🚀', 'Game Engine': '⚙️',
}

const riskColor: Record<string, string> = { None: '#ffffff', Low: '#cccccc', Medium: '#999999', High: '#666666' }

function detectSpec(data: any): SystemSpec {
  const si = data?.systemInfo || {}
  return {
    cpuModel: si.cpu?.model || 'Unknown',
    cpuCores: si.cpu?.cores || 0,
    cpuThreads: si.cpu?.threads || 0,
    cpuMaxClock: si.cpu?.maxClockMhz || 0,
    gpuModel: si.gpu?.model || 'Unknown',
    gpuVram: si.gpu?.vram || 0,
    gpuVendor: si.gpu?.vendor || 'unknown',
    ramTotal: si.ram?.total || 0,
    diskDrives: si.disk?.drives || [],
    osVersion: si.os?.version || 'Unknown',
    osBuild: si.os?.build || '0',
    powerPlan: si.powerPlan || 'Unknown',
    gameMode: si.gameMode,
    networkLatency: si.network?.latencyMs || null,
    mouseAccel: si.mouse?.enhancePointerPrecision || false,
    startupCount: si.startup?.count || 0,
    bgProcesses: si.processes?.background || 0,
  }
}

function generateRecs(spec: SystemSpec, game?: GameProfile): Rec[] {
  const recs: Rec[] = []
  const cpu = spec.cpuModel.toLowerCase()
  const gpu = spec.gpuModel.toLowerCase()
  const isNvidia = gpu.includes('nvidia') || gpu.includes('geforce') || gpu.includes('rtx') || gpu.includes('gtx')
  const isAmdGpu = gpu.includes('radeon') || gpu.includes('rx') || gpu.includes('amd')
  const isAmd = cpu.includes('amd') || cpu.includes('ryzen')
  const isIntel = cpu.includes('intel') || cpu.includes('core') || cpu.includes('i3') || cpu.includes('i5') || cpu.includes('i7') || cpu.includes('i9')
  const isHighEnd = cpu.includes('i9') || cpu.includes('ryzen 9') || cpu.includes('ryzen 7') || cpu.includes('i7') || spec.cpuCores >= 8
  const ramGB = spec.ramTotal

  // ── POWER PLAN ──
  if (spec.powerPlan !== 'High performance' && spec.powerPlan !== 'Ultimate Performance') {
    recs.push({ category: 'Power Plan', setting: 'Power Plan', current: spec.powerPlan, recommended: 'High Performance', reason: 'Prevents CPU throttling and maintains max clock speeds during gameplay.', fpsGain: [5, 15], risk: 'None', reversible: true, tweakId: 'sys-high-performance' })
  }

  // ── WINDOWS ──
  if (spec.gameMode === false) {
    recs.push({ category: 'Windows', setting: 'Game Mode', current: 'Disabled', recommended: 'Enabled', reason: 'Prioritizes game processes and blocks Windows Update during gaming.', fpsGain: [1, 3], risk: 'None', reversible: true, tweakId: 'sys-enable-game-mode' })
  }

  recs.push({ category: 'Windows', setting: 'Fullscreen Optimizations', current: 'Enabled', recommended: 'Disabled for game exe', reason: 'Prevents DWM overlay from adding latency in exclusive fullscreen.', fpsGain: [1, 4], risk: 'None', reversible: true, tweakId: 'sys-disable-fullscreen-opt' })

  recs.push({ category: 'Windows', setting: 'Visual Effects', current: 'Let Windows choose', recommended: 'Best Performance', reason: 'Disables transparency, animations, and shadows — frees GPU/CPU for games.', fpsGain: [2, 8], risk: 'None', reversible: true, tweakId: 'sys-visual-effects' })

  recs.push({ category: 'Windows', setting: 'Notifications', current: 'Enabled', recommended: 'Disabled while gaming', reason: 'Prevents notification popups from stealing focus and using resources.', fpsGain: [1, 3], risk: 'None', reversible: true, tweakId: 'windows-notification-optimization' })

  recs.push({ category: 'Windows', setting: 'Windows Animations', current: 'Enabled', recommended: 'Disabled', reason: 'Eliminates window animation overhead. Desktop feels snappier.', fpsGain: [1, 2], risk: 'None', reversible: true, tweakId: 'windows-animation-optimization' })

  // ── BACKGROUND ──
  recs.push({ category: 'Background Apps', setting: 'Background Apps', current: `${spec.bgProcesses} processes`, recommended: 'Minimal', reason: `${spec.bgProcesses} background processes consuming RAM and CPU. Close browsers, Discord overlay, etc.`, fpsGain: spec.bgProcesses > 50 ? [5, 20] : [2, 8], risk: 'None', reversible: true, tweakId: 'debloat-remove-background' })

  if (spec.startupCount > 5) {
    recs.push({ category: 'Startup', setting: 'Startup Programs', current: `${spec.startupCount} programs`, recommended: '< 5 programs', reason: `${spec.startupCount} startup programs slow boot and consume background resources.`, fpsGain: [2, 8], risk: 'None', reversible: true, tweakId: 'debloat-disable-startup' })
  }

  recs.push({ category: 'Background Apps', setting: 'Superfetch / SysMain', current: 'Running', recommended: 'Disabled', reason: 'Superfetch preloads apps into RAM, competing with games for memory.', fpsGain: [2, 6], risk: 'None', reversible: true, tweakId: 'debloat-superfetch' })

  // ── NVIDIA ──
  if (isNvidia) {
    recs.push({ category: 'NVIDIA', setting: 'Power Management', current: 'Optimal Power', recommended: 'Prefer Maximum Performance', reason: 'Prevents GPU clock speed drops during intense scenes.', fpsGain: [3, 12], risk: 'None', reversible: true, tweakId: 'nv-max-power' })

    recs.push({ category: 'NVIDIA', setting: 'V-Sync', current: 'Enabled', recommended: 'Off (use in-game instead)', reason: 'Driver V-Sync adds input lag. Use game-specific V-Sync or G-Sync.', fpsGain: [1, 5], risk: 'None', reversible: true, tweakId: 'nv-disable-vsync' })

    recs.push({ category: 'NVIDIA', setting: 'Low Latency Mode', current: 'Off', recommended: 'On', reason: 'Reduces render queue to minimum, lowering input-to-display latency.', fpsGain: [0, 2], risk: 'None', reversible: true, tweakId: 'nv-low-latency' })

    recs.push({ category: 'NVIDIA', setting: 'Texture Filtering', current: 'Quality', recommended: 'High Performance', reason: 'Reduces anisotropic filtering quality — barely noticeable visual impact.', fpsGain: [2, 6], risk: 'None', reversible: true, tweakId: 'nv-texture-filtering' })

    recs.push({ category: 'NVIDIA', setting: 'Shader Cache', current: 'Unknown', recommended: 'On', reason: 'Pre-compiles shaders to prevent in-game stuttering.', fpsGain: [1, 5], risk: 'None', reversible: true, tweakId: 'nv-optimize-shader-cache' })

    if (spec.gpuVram >= 8) {
      recs.push({ category: 'NVIDIA', setting: 'Hardware Scheduling', current: 'Unknown', recommended: 'Enabled', reason: 'GPU manages its own memory scheduling, reducing CPU overhead.', fpsGain: [1, 5], risk: 'None', reversible: true, tweakId: 'nv-hardware-scheduling' })
    }
  }

  // ── AMD GPU ──
  if (isAmdGpu) {
    recs.push({ category: 'AMD', setting: 'Radeon Chill', current: 'Unknown', recommended: 'Off', reason: 'Chill caps FPS to save power. Disable for maximum performance.', fpsGain: [5, 20], risk: 'None', reversible: true })
    recs.push({ category: 'AMD', setting: 'Radeon Anti-Lag', current: 'Unknown', recommended: 'On', reason: 'Reduces CPU-GPU frame pacing delay, lowering input latency.', fpsGain: [0, 3], risk: 'None', reversible: true })
    recs.push({ category: 'AMD', setting: 'Radeon Image Sharpening', current: 'Unknown', recommended: 'On (with lower render scale)', reason: 'Lets you render at lower resolution then sharpen — big FPS with less blur than native.', fpsGain: [3, 12], risk: 'None', reversible: true })
  }

  // ── CPU ──
  recs.push({ category: 'CPU', setting: 'Core Parking', current: 'Unknown', recommended: 'All cores active', reason: 'Parked cores cannot process game threads, causing frame drops.', fpsGain: [3, 12], risk: 'None', reversible: true, tweakId: 'cpu-core-parking-disable' })

  recs.push({ category: 'CPU', setting: 'SMT / Hyper-Threading', current: 'Unknown', recommended: 'Enabled', reason: 'More logical cores = better multithreaded game performance.', fpsGain: [2, 8], risk: 'None', reversible: true, tweakId: 'cpu-smt-enable' })

  if (game?.cpuIntensive || isHighEnd) {
    recs.push({ category: 'CPU', setting: 'Game Process Priority', current: 'Normal', recommended: 'High', reason: 'Gives the game CPU priority over background processes.', fpsGain: [3, 10], risk: 'Low', reversible: true, tweakId: 'sys-cpu-priority' })
  }

  // ── GPU ──
  recs.push({ category: 'GPU', setting: 'GPU Driver', current: 'Unknown', recommended: 'Latest Game Ready', reason: 'New drivers include game-specific optimizations and bug fixes.', fpsGain: [2, 10], risk: 'None', reversible: true })

  // ── MEMORY ──
  recs.push({ category: 'RAM', setting: 'Memory Cleaner', current: 'Idle pages in RAM', recommended: 'Wake list cleaned', reason: 'Frees stale memory pages, giving games more available RAM.', fpsGain: [2, 8], risk: 'None', reversible: true, tweakId: 'memory-wake-cleaner' })

  if (ramGB <= 8) {
    recs.push({ category: 'RAM', setting: 'Page File', current: 'System Managed', recommended: '1.5x RAM', reason: 'Low RAM systems need sufficient page file to avoid crashes.', fpsGain: [3, 10], risk: 'Low', reversible: true, tweakId: 'memory-pagefile-manager' })
  }

  recs.push({ category: 'RAM', setting: 'Page Prefetch', current: 'Enabled', recommended: 'Optimized', reason: 'Optimizes which apps preload into RAM at boot.', fpsGain: [1, 4], risk: 'None', reversible: true, tweakId: 'memory-page-prefetch' })

  // ── STORAGE ──
  const hasSSD = spec.diskDrives.some(d => d.sizeGB > 0)
  if (hasSSD) {
    recs.push({ category: 'Storage', setting: 'TRIM Optimization', current: 'Unknown', recommended: 'Enabled', reason: 'Maintains SSD write performance over time.', fpsGain: [0, 2], risk: 'None', reversible: true, tweakId: 'storage-trim-optimization' })
  }

  recs.push({ category: 'Storage', setting: 'Write Cache', current: 'Unknown', recommended: 'Enabled', reason: 'Buffers disk writes in RAM before flushing, reducing I/O stalls.', fpsGain: [1, 4], risk: 'None', reversible: true, tweakId: 'storage-write-cache' })

  recs.push({ category: 'Storage', setting: 'Temp File Cleanup', current: 'Unknown', recommended: 'Clean', reason: 'Removes temp files that slow down file access and waste disk space.', fpsGain: [0, 3], risk: 'None', reversible: true, tweakId: 'storage-temp-file-cleaner' })

  // ── NETWORK (latency only) ──
  recs.push({ category: 'Network', setting: 'DNS Optimization', current: 'ISP default', recommended: 'Cloudflare/Google', reason: 'Faster DNS = faster game server connections.', fpsGain: [0, 0], risk: 'None', reversible: true, tweakId: 'net-optimize-dns' })

  recs.push({ category: 'Network', setting: 'Background Updates', current: 'Enabled', recommended: 'Disabled while gaming', reason: 'Windows Update and store updates steal bandwidth during matches.', fpsGain: [0, 0], risk: 'None', reversible: true, tweakId: 'net-disable-background-updates' })

  recs.push({ category: 'Network', setting: 'TCP Reset', current: 'Unknown', recommended: 'Reset to defaults', reason: 'Clears corrupted TCP state that causes packet loss and high ping.', fpsGain: [0, 0], risk: 'None', reversible: true, tweakId: 'net-reset-tcp' })

  if (spec.networkLatency && spec.networkLatency > 30) {
    recs.push({ category: 'Network', setting: 'Network Latency', current: `${spec.networkLatency}ms`, recommended: '< 20ms', reason: `Your ping is ${spec.networkLatency}ms. Use Ethernet, close bandwidth apps, or use QoS.`, fpsGain: [0, 0], risk: 'None', reversible: true })
  }

  // ── MOUSE ──
  if (spec.mouseAccel) {
    recs.push({ category: 'GPU', setting: 'Mouse Acceleration', current: 'ON', recommended: 'OFF', reason: 'Mouse acceleration causes inconsistent aiming. Raw input gives 1:1 movement.', fpsGain: [0, 0], risk: 'None', reversible: true, tweakId: 'mouse-disable-acceleration' })
  }

  recs.push({ category: 'GPU', setting: 'Raw Mouse Input', current: 'Default', recommended: 'Forced ON', reason: 'Bypasses Windows mouse processing for lowest input latency.', fpsGain: [0, 0], risk: 'None', reversible: true, tweakId: 'mouse-raw-input' })

  // ── BIOS (if high end) ──
  if (isHighEnd) {
    recs.push({ category: 'BIOS', setting: 'XMP / EXPO Profile', current: 'JEDEC (slow)', recommended: 'XMP/EXPO enabled', reason: 'RAM runs at 2133 MHz by default. XMP unlocks rated speed (3200-6000 MHz).', fpsGain: [5, 20], risk: 'Low', reversible: true })
    recs.push({ category: 'BIOS', setting: 'Resizable BAR', current: 'Unknown', recommended: 'Enabled', reason: 'Lets CPU access full GPU VRAM in one request, improving draw calls.', fpsGain: [2, 10], risk: 'Low', reversible: true })
  }

  // ── ADVANCED ──
  if (isHighEnd) {
    recs.push({ category: 'Advanced', setting: 'Timer Resolution', current: '15.6ms', recommended: '0.5ms (gaming)', reason: 'Higher timer precision reduces input polling delay in games.', fpsGain: [0, 2], risk: 'Low', reversible: true })
    recs.push({ category: 'Advanced', setting: 'HPET', current: 'Enabled', recommended: 'Disabled', reason: 'HPET can cause timer drift and micro-stutters in some engines.', fpsGain: [1, 5], risk: 'Medium', reversible: true, advanced: true })
  }

  // ── GAME SPECIFIC ──
  if (game) {
    const r = game.recommended
    recs.push({ category: 'Game Settings', setting: 'Render Scale', current: '100%', recommended: r.renderScale, reason: 'Lower render scale has massive FPS impact with DLSS/FSR upscaling.', fpsGain: [5, 30], risk: 'None', reversible: true })
    recs.push({ category: 'Game Settings', setting: 'Shadows', current: 'High', recommended: r.shadows, reason: 'Shadows are the most GPU-expensive setting in most games.', fpsGain: [3, 15], risk: 'None', reversible: true })
    recs.push({ category: 'Game Settings', setting: 'Textures', current: 'Epic', recommended: r.textures, reason: 'High textures need VRAM. Match to your GPU VRAM.', fpsGain: [1, 5], risk: 'None', reversible: true })
    recs.push({ category: 'Game Settings', setting: 'Effects Quality', current: 'High', recommended: r.effects, reason: 'Particle effects cause FPS drops in fights. Low = stable framerate.', fpsGain: [3, 12], risk: 'None', reversible: true })
    recs.push({ category: 'Game Settings', setting: 'Post Processing', current: 'High', recommended: r.postProcess, reason: 'Bloom, DOF, motion blur — all add GPU overhead with no competitive benefit.', fpsGain: [2, 8], risk: 'None', reversible: true })
    recs.push({ category: 'Game Settings', setting: 'Anti-Aliasing', current: 'High', recommended: r.aa, reason: 'AA is expensive. TAA/FXAA are cheaper alternatives.', fpsGain: [2, 10], risk: 'None', reversible: true })
    recs.push({ category: 'Game Settings', setting: 'Ray Tracing', current: 'Unknown', recommended: r.rt, reason: 'Ray tracing doubles GPU load. Off = massive FPS gain.', fpsGain: [15, 60], risk: 'None', reversible: true })
    recs.push({ category: 'Game Settings', setting: 'V-Sync', current: 'Unknown', recommended: r.vsync, reason: 'V-Sync caps FPS and adds input lag. Use G-Sync/FreeSync instead.', fpsGain: [1, 5], risk: 'None', reversible: true })
    recs.push({ category: 'Game Settings', setting: 'Motion Blur', current: 'Unknown', recommended: r.motionBlur, reason: 'Motion blur adds post-processing and reduces visual clarity.', fpsGain: [1, 3], risk: 'None', reversible: true })

    if (r.dlssFsr !== 'Off') {
      recs.push({ category: 'Game Settings', setting: 'DLSS / FSR', current: 'Off', recommended: r.dlssFsr, reason: 'AI upscaling renders at lower res then reconstructs — huge FPS with minimal quality loss.', fpsGain: [10, 40], risk: 'None', reversible: true })
    }

    if (game.launchOptions) {
      recs.push({ category: 'Game Launch', setting: 'Launch Options', current: 'None', recommended: game.launchOptions, reason: 'Game-specific launch parameters optimize engine behavior.', fpsGain: [2, 8], risk: 'Low', reversible: true })
    }

    if (game.cpuIntensive) {
      recs.push({ category: 'Game Engine', setting: 'CPU Thread Affinity', current: 'All cores', recommended: 'Performance cores only', reason: 'CPU-bound games benefit from scheduling on fastest cores.', fpsGain: [3, 10], risk: 'Low', reversible: true })
    }

    if (game.gpuIntensive) {
      recs.push({ category: 'Game Engine', setting: 'GPU Memory', current: 'Auto', recommended: 'High (if VRAM allows)', reason: 'Pre-loads textures into VRAM to prevent streaming stutter.', fpsGain: [2, 8], risk: 'Low', reversible: true })
    }
  }

  return recs
}

export function AIOptimizerPage() {
  const [spec, setSpec] = useState<SystemSpec | null>(null)
  const [scanning, setScanning] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string>('')
  const [result, setResult] = useState<Rec[] | null>(null)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [appliedTweaks, setAppliedTweaks] = useState<Set<string>>(new Set())

  const detect = useCallback(async () => {
    if (!window.electronAPI) return
    setScanning(true)
    try {
      const data = await window.electronAPI.advisorScan()
      setSpec(detectSpec(data))
    } catch {}
    setScanning(false)
  }, [])

  useEffect(() => { detect() }, [detect])

  const game = useMemo(() => GAMES.find(g => g.id === selectedGame) || undefined, [selectedGame])

  const runAnalysis = () => {
    if (!spec) return
    const recs = generateRecs(spec, game)
    setResult(recs)
    if (recs.length > 0) setExpandedCat(recs[0].category)
  }

  const applyTweak = async (tweakId: string) => {
    if (!window.electronAPI?.applyTweak) return
    try {
      await window.electronAPI.applyTweak(tweakId)
      setAppliedTweaks(prev => new Set(prev).add(tweakId))
    } catch {}
  }

  const grouped = useMemo(() => {
    if (!result) return {}
    return result.reduce<Record<string, Rec[]>>((acc, rec) => {
      if (!acc[rec.category]) acc[rec.category] = []
      acc[rec.category].push(rec)
      return acc
    }, {})
  }, [result])

  const totals = useMemo(() => {
    if (!result) return { fpsMin: 0, fpsMax: 0, lowMin: 0, lowMax: 0, latMin: 0, latMax: 0 }
    let fMin = 0, fMax = 0
    result.forEach(r => { fMin += r.fpsGain[0]; fMax += r.fpsGain[1] })
    return { fpsMin: fMin, fpsMax: fMax, lowMin: Math.round(fMin * 0.4), lowMax: Math.round(fMax * 0.6), latMin: Math.round(fMin * 0.15), latMax: Math.round(fMax * 0.35) }
  }, [result])

  const score = useMemo(() => {
    if (!spec) return 0
    let s = 50
    if (spec.powerPlan === 'High performance' || spec.powerPlan === 'Ultimate Performance') s += 10
    if (spec.gameMode) s += 5
    if (spec.cpuCores >= 8) s += 10
    if (spec.ramTotal >= 16) s += 10
    if (spec.gpuVram >= 8) s += 10
    if (!spec.mouseAccel) s += 5
    if (spec.bgProcesses < 30) s += 5
    return Math.min(s, 100)
  }, [spec])

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: 'thin' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <Bot className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </div>
        <div>
          <h1 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>AI FPS Optimizer</h1>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Auto-detect your hardware, pick a game, get personalized tweaks</p>
        </div>
      </div>

      {/* Specs Panel */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Detected Hardware</div>
          <button onClick={detect} disabled={scanning} className="text-[10px] px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
            {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
            {scanning ? 'Scanning...' : 'Rescan'}
          </button>
        </div>
        {spec ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-1.5 mb-1"><Cpu className="w-3 h-3" style={{ color: 'var(--text-muted)' }} /><span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>CPU</span></div>
              <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{spec.cpuModel}</div>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{spec.cpuCores}C / {spec.cpuThreads}T / {spec.cpuMaxClock}MHz</div>
            </div>
            <div className="p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-1.5 mb-1"><Monitor className="w-3 h-3" style={{ color: 'var(--text-muted)' }} /><span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>GPU</span></div>
              <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{spec.gpuModel}</div>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{spec.gpuVram}GB VRAM</div>
            </div>
            <div className="p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-1.5 mb-1"><Zap className="w-3 h-3" style={{ color: 'var(--text-muted)' }} /><span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>RAM</span></div>
              <div className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{spec.ramTotal} GB</div>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{spec.bgProcesses} bg processes</div>
            </div>
            <div className="p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-1.5 mb-1"><Settings className="w-3 h-3" style={{ color: 'var(--text-muted)' }} /><span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>System</span></div>
              <div className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{spec.powerPlan}</div>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>GM: {spec.gameMode ? 'On' : 'Off'} • Mouse: {spec.mouseAccel ? 'Accel' : 'Raw'}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>{scanning ? 'Scanning your hardware...' : 'Click Rescan to detect hardware'}</div>
        )}
      </div>

      {/* Game Selector */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
        <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Game (Optional)</div>
        <div className="grid grid-cols-4 gap-2">
          {GAMES.map(g => (
            <button key={g.id} onClick={() => setSelectedGame(selectedGame === g.id ? '' : g.id)}
              className="p-2 rounded-lg text-center transition-all text-[10px] font-medium"
              style={{
                background: selectedGame === g.id ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: selectedGame === g.id ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${selectedGame === g.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
              }}>
              {g.name}
            </button>
          ))}
        </div>
        {game && (
          <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
            <div className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{game.name} Profile</div>
            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{game.settingsSummary}</div>
            {game.launchOptions && <div className="text-[9px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>Launch: {game.launchOptions}</div>}
          </div>
        )}
      </div>

      {/* Analyze Button */}
      {!result && (
        <button onClick={runAnalysis} disabled={!spec || scanning}
          className="w-full py-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#000' }}>
          <Sparkles className="w-4 h-4" />
          Analyze & Generate Optimizations
        </button>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'FPS Gain', value: `+${totals.fpsMin}-${totals.fpsMax}`, color: 'var(--text-primary)' },
              { label: '1% Low', value: `+${totals.lowMin}-${totals.lowMax}%`, color: 'var(--text-primary)' },
              { label: 'Latency', value: `-${totals.latMin}-${totals.latMax}ms`, color: 'var(--text-primary)' },
              { label: 'Score', value: `${score}/100`, color: score >= 70 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)' },
              { label: 'Tweaks', value: `${result.length}`, color: 'var(--text-primary)' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <div className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {appliedTweaks.size} / {result.length} applied • Remaining potential: {totals.fpsMax > 30 ? 'High' : totals.fpsMax > 15 ? 'Medium' : 'Low'}
            </div>
            <button onClick={() => { setResult(null); setSelectedGame('') }}
              className="text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
              <RotateCcw className="w-3 h-3" /> Re-analyze
            </button>
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            {Object.entries(grouped).map(([cat, recs]) => {
              const catApplied = recs.filter(r => r.tweakId && appliedTweaks.has(r.tweakId)).length
              return (
                <div key={cat} className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <button onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:opacity-90 transition-opacity">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]">{catIcons[cat] || '📋'}</span>
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{cat}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                        {catApplied}/{recs.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold" style={{ color: 'var(--success)' }}>
                        +{Math.min(...recs.map(r => r.fpsGain[0]))}-{Math.max(...recs.map(r => r.fpsGain[1]))} FPS
                      </span>
                      {expandedCat === cat ? <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </button>
                  {expandedCat === cat && (
                    <div className="px-4 pb-3 space-y-2">
                      {recs.map((rec, i) => {
                        const applied = !!(rec.tweakId && appliedTweaks.has(rec.tweakId))
                        return (
                          <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', opacity: applied ? 0.6 : 1 }}>
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{rec.setting}</div>
                              <div className="flex items-center gap-1.5">
                                {rec.advanced && <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--danger)20', color: 'var(--danger)' }}>ADVANCED</span>}
                                <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: riskColor[rec.risk] + '20', color: riskColor[rec.risk] }}>{rec.risk}</span>
                                {rec.reversible && <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: 'var(--success)' }}>Reversible</span>}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-1.5">
                              <div>
                                <span className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>Current: </span>
                                <span className="text-[10px]" style={{ color: 'var(--danger)' }}>{rec.current}</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>Recommended: </span>
                                <span className="text-[10px] font-semibold" style={{ color: 'var(--success)' }}>{rec.recommended}</span>
                              </div>
                            </div>
                            <div className="text-[10px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>{rec.reason}</div>
                            <div className="flex items-center justify-between">
                              <div className="text-[10px] font-bold" style={{ color: 'var(--success)' }}>
                                {rec.fpsGain[0] > 0 || rec.fpsGain[1] > 0 ? `+${rec.fpsGain[0]}-${rec.fpsGain[1]} FPS` : 'Latency only'}
                              </div>
                              {rec.tweakId && (
                                <button onClick={() => rec.tweakId && applyTweak(rec.tweakId)} disabled={applied}
                                  className="px-3 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all"
                                  style={{
                                    background: applied ? 'var(--bg-secondary)' : 'var(--accent)',
                                    color: applied ? 'var(--text-muted)' : '#000',
                                    opacity: applied ? 0.5 : 1,
                                  }}>
                                  {applied ? <><CheckCircle className="w-3 h-3" /> Applied</> : 'Apply'}
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
        </>
      )}
    </div>
  )
}
