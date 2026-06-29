'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Bot, Cpu, Monitor, Zap, ChevronRight, ChevronDown, RotateCcw, CheckCircle, AlertTriangle, Gamepad2, Settings, Loader2, Sparkles, Download, Target, TrendingUp, Shield, Clock, ArrowRight, X, Flame } from 'lucide-react'

interface SystemSpec {
  cpuModel: string
  cpuCores: number
  cpuThreads: number
  cpuMaxClock: number
  cpuUsage: number
  gpuModel: string
  gpuVram: number
  gpuVendor: string
  ramTotal: number
  ramUsed: number
  diskDrives: { letter: string; sizeGB: number; freeGB: number }[]
  osVersion: string
  osBuild: string
  powerPlan: string
  gameMode: boolean | null
  networkLatency: number | null
  mouseAccel: boolean
  startupCount: number
  bgProcesses: number
  totalProcesses: number
}

interface Rec {
  id: string
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
  priority: number
  bottleneck?: string
}

interface GameProfile {
  id: string
  name: string
  exe: string
  gpuIntensive: boolean
  cpuIntensive: boolean
  esports: boolean
  estimatedFps: (spec: SystemSpec) => [number, number]
  recommended: Record<string, string>
  launchOptions: string
  settingsSummary: string
  tags: string[]
}

interface Bottleneck {
  component: 'CPU' | 'GPU' | 'RAM' | 'Storage' | 'Network'
  severity: 'critical' | 'warning' | 'info'
  description: string
  impact: string
  fix: string
}

const GAMES: GameProfile[] = [
  {
    id: 'fortnite', name: 'Fortnite', exe: 'FortniteClient-Win64-Shipping.exe',
    gpuIntensive: true, cpuIntensive: true, esports: false, tags: ['Battle Royale', 'Unreal Engine'],
    estimatedFps: (s) => {
      let base = 60
      if (s.gpuVram >= 8) base += 40
      else if (s.gpuVram >= 6) base += 20
      if (s.cpuCores >= 8) base += 30
      else if (s.cpuCores >= 6) base += 15
      if (s.ramTotal >= 16) base += 15
      if (s.gpuVendor === 'nvidia') base += 10
      return [Math.round(base * 0.6), Math.round(base * 1.4)]
    },
    recommended: { 'Render Scale': '100%', Shadows: 'Medium', Textures: 'High', Effects: 'Low', 'Post Process': 'Low', AA: 'Off', 'Ray Tracing': 'Off', VSync: 'Off', 'Motion Blur': 'Off', DLSS: 'Performance' },
    launchOptions: '-USEALLAVAILABLECORES -dx12 -NOSPLASH',
    settingsSummary: 'Low settings + DLSS Performance for max FPS. Medium shadows for visibility.',
  },
  {
    id: 'valorant', name: 'Valorant', exe: 'VALORANT-Win64-Shipping.exe',
    gpuIntensive: false, cpuIntensive: true, esports: true, tags: ['FPS', 'Competitive', 'Low-spec Friendly'],
    estimatedFps: (s) => {
      let base = 120
      if (s.cpuCores >= 8) base += 60
      else if (s.cpuCores >= 6) base += 30
      if (s.cpuMaxClock >= 4500) base += 40
      else if (s.cpuMaxClock >= 3500) base += 20
      if (s.ramTotal >= 16) base += 15
      return [Math.round(base * 0.7), Math.round(base * 1.3)]
    },
    recommended: { 'Render Scale': '100%', Shadows: 'Low', Textures: 'Medium', Effects: 'Low', 'Post Process': 'Low', AA: 'MSAA 2x', 'Ray Tracing': 'Off', VSync: 'Off', 'Motion Blur': 'Off', DLSS: 'Off' },
    launchOptions: '',
    settingsSummary: 'Low settings + MSAA for clarity. CPU-bound — optimize CPU priority.',
  },
  {
    id: 'cs2', name: 'Counter-Strike 2', exe: 'cs2.exe',
    gpuIntensive: false, cpuIntensive: true, esports: true, tags: ['FPS', 'Competitive', 'Source 2'],
    estimatedFps: (s) => {
      let base = 150
      if (s.cpuCores >= 8) base += 80
      else if (s.cpuCores >= 6) base += 40
      if (s.cpuMaxClock >= 4500) base += 50
      else if (s.cpuMaxClock >= 3500) base += 25
      if (s.gpuVram >= 6) base += 20
      return [Math.round(base * 0.6), Math.round(base * 1.3)]
    },
    recommended: { 'Render Scale': '100%', Shadows: 'Medium', Textures: 'High', Effects: 'Low', 'Post Process': 'Low', AA: 'MSAA 4x', 'Ray Tracing': 'Off', VSync: 'Off', 'Motion Blur': 'Off', DLSS: 'Off' },
    launchOptions: '-novid -high -threads 0',
    settingsSummary: 'Competitive settings. Medium shadows for enemy visibility.',
  },
  {
    id: 'apex', name: 'Apex Legends', exe: 'r5apex.exe',
    gpuIntensive: true, cpuIntensive: false, esports: true, tags: ['Battle Royale', 'FPS', 'Source'],
    estimatedFps: (s) => {
      let base = 80
      if (s.gpuVram >= 8) base += 40
      else if (s.gpuVram >= 6) base += 20
      if (s.cpuCores >= 6) base += 20
      if (s.ramTotal >= 16) base += 10
      return [Math.round(base * 0.6), Math.round(base * 1.3)]
    },
    recommended: { 'Render Scale': '100%', Shadows: 'Low', Textures: 'High', Effects: 'Low', 'Post Process': 'Low', AA: 'TSAA', 'Ray Tracing': 'Off', VSync: 'Off', 'Motion Blur': 'Off', DLSS: 'Quality' },
    launchOptions: '+fps_max 0 -high',
    settingsSummary: 'Low everything except textures. DLSS Quality if NVIDIA.',
  },
  {
    id: 'warzone', name: 'Warzone / MW3', exe: 'ModernWarfare.exe',
    gpuIntensive: true, cpuIntensive: true, esports: false, tags: ['Battle Royale', 'AAA', 'Demanding'],
    estimatedFps: (s) => {
      let base = 50
      if (s.gpuVram >= 8) base += 30
      else if (s.gpuVram >= 6) base += 15
      if (s.cpuCores >= 8) base += 25
      else if (s.cpuCores >= 6) base += 10
      if (s.ramTotal >= 16) base += 10
      if (s.ramTotal >= 32) base += 5
      return [Math.round(base * 0.5), Math.round(base * 1.4)]
    },
    recommended: { 'Render Scale': '90%', Shadows: 'Low', Textures: 'Normal', Effects: 'Low', 'Post Process': 'Low', AA: 'Off', 'Ray Tracing': 'Off', VSync: 'Off', 'Motion Blur': 'Off', DLSS: 'Performance' },
    launchOptions: '',
    settingsSummary: '90% render scale + DLSS Performance. Most demanding BR.',
  },
  {
    id: 'rocketleague', name: 'Rocket League', exe: 'RocketLeague.exe',
    gpuIntensive: false, cpuIntensive: false, esports: false, tags: ['Sports', 'Lightweight', 'Optimized'],
    estimatedFps: (s) => {
      let base = 200
      if (s.gpuVram >= 4) base += 100
      if (s.cpuCores >= 4) base += 50
      return [Math.round(base * 0.7), Math.round(base * 1.2)]
    },
    recommended: { 'Render Scale': '100%', Shadows: 'High', Textures: 'High', Effects: 'Quality', 'Post Process': 'Performance', AA: 'Off', 'Ray Tracing': 'Off', VSync: 'Off', 'Motion Blur': 'Off', DLSS: 'Off' },
    launchOptions: '',
    settingsSummary: 'Game runs great on most hardware. Performance qualities.',
  },
  {
    id: 'minecraft', name: 'Minecraft', exe: 'javaw.exe',
    gpuIntensive: false, cpuIntensive: true, esports: false, tags: ['Sandbox', 'Java', 'Moddable'],
    estimatedFps: (s) => {
      let base = 80
      if (s.cpuCores >= 6) base += 40
      if (s.ramTotal >= 16) base += 30
      else if (s.ramTotal >= 8) base += 10
      if (s.cpuMaxClock >= 4000) base += 20
      return [Math.round(base * 0.5), Math.round(base * 2)]
    },
    recommended: { 'Render Scale': '100%', Shadows: 'Fancy', Textures: 'Default', Effects: 'Fancy', 'Post Process': 'N/A', AA: 'Off', 'Ray Tracing': 'Off', VSync: 'Off', 'Motion Blur': 'Off', DLSS: 'Off' },
    launchOptions: '-Xmx4G -XX:+UseG1GC -XX:+UnlockExperimentalVMOptions',
    settingsSummary: 'Allocate 4GB+ RAM. Sodium mod gives 2-3x FPS. Iris for shaders.',
  },
  {
    id: 'genshin', name: 'Genshin Impact', exe: 'GenshinImpact.exe',
    gpuIntensive: true, cpuIntensive: false, esports: false, tags: ['RPG', 'Open World', 'Anime'],
    estimatedFps: (s) => {
      let base = 45
      if (s.gpuVram >= 8) base += 25
      else if (s.gpuVram >= 4) base += 10
      if (s.cpuCores >= 6) base += 10
      return [Math.round(base * 0.7), Math.round(base * 1.3)]
    },
    recommended: { 'Render Scale': '1.0', Shadows: 'Low', Textures: 'High', Effects: 'Low', 'Post Process': 'Low', AA: 'Off', 'Ray Tracing': 'Off', VSync: 'Off', 'Motion Blur': 'Off', DLSS: 'Off' },
    launchOptions: '',
    settingsSummary: 'Low shadows/effects, high textures. GPU-limited game.',
  },
]

const catIcons: Record<string, string> = {
  'Power Plan': '⚡', 'Windows': '🪟', 'Background': '📱', 'Startup': '🚀',
  'NVIDIA': '🟢', 'AMD': '🔴', 'CPU': '🧠', 'GPU': '🎮', 'RAM': '💾',
  'Storage': '💿', 'Network': '🌐', 'BIOS': '⚙️', 'Advanced': '🔬',
  'Game Settings': '🖼', 'Game Launch': '🚀', 'Game Engine': '⚙️',
}

const riskColor: Record<string, string> = { None: '#ffffff', Low: '#cccccc', Medium: '#999999', High: '#666666' }

function detectSpec(data: any): SystemSpec {
  const si = data?.systemInfo || {}
  return {
    cpuModel: si.cpu?.model || 'Unknown', cpuCores: si.cpu?.cores || 0, cpuThreads: si.cpu?.threads || 0,
    cpuMaxClock: si.cpu?.maxClockMhz || 0, cpuUsage: si.cpu?.usage || 0,
    gpuModel: si.gpu?.model || 'Unknown', gpuVram: si.gpu?.vram || 0, gpuVendor: si.gpu?.vendor || 'unknown',
    ramTotal: si.ram?.total || 0, ramUsed: si.ram?.used || 0,
    diskDrives: si.disk?.drives || [], osVersion: si.os?.version || 'Unknown', osBuild: si.os?.build || '0',
    powerPlan: si.powerPlan || 'Unknown', gameMode: si.gameMode,
    networkLatency: si.network?.latencyMs || null, mouseAccel: si.mouse?.enhancePointerPrecision || false,
    startupCount: si.startup?.count || 0, bgProcesses: si.processes?.background || 0, totalProcesses: si.processes?.total || 0,
  }
}

function detectBottlenecks(spec: SystemSpec, game?: GameProfile): Bottleneck[] {
  const bn: Bottleneck[] = []
  const cpu = spec.cpuModel.toLowerCase()

  // CPU bottleneck
  if (spec.cpuCores < 4) {
    bn.push({ component: 'CPU', severity: 'critical', description: `${spec.cpuCores} cores is below minimum for modern games`, impact: 'Severe frame drops, stuttering', fix: 'Upgrade to 6+ core CPU' })
  } else if (spec.cpuCores < 6 && (game?.cpuIntensive || game?.esports)) {
    bn.push({ component: 'CPU', severity: 'warning', description: `Only ${spec.cpuCores} cores — CPU-bound games will bottleneck`, impact: 'Low 1% in CPU-heavy scenes', fix: 'Upgrade to 8-core CPU or reduce background processes' })
  }

  if (spec.cpuMaxClock > 0 && spec.cpuMaxClock < 3500) {
    bn.push({ component: 'CPU', severity: 'warning', description: `Max clock ${spec.cpuMaxClock}MHz is low for gaming`, impact: 'Reduced single-thread performance', fix: 'Enable XMP/OC in BIOS or upgrade CPU' })
  }

  // GPU bottleneck
  if (spec.gpuVram > 0 && spec.gpuVram < 4) {
    bn.push({ component: 'GPU', severity: 'critical', description: `${spec.gpuVram}GB VRAM — many games need 4GB+`, impact: 'Texture pop-in, crashes in demanding games', fix: 'Upgrade GPU with 6GB+ VRAM' })
  } else if (spec.gpuVram >= 4 && spec.gpuVram < 6 && game?.gpuIntensive) {
    bn.push({ component: 'GPU', severity: 'warning', description: `${spec.gpuVram}GB VRAM may not be enough for ${game?.name || 'AAA games'}`, impact: 'Reduced texture quality, possible stutter', fix: 'Lower texture quality or upgrade GPU' })
  }

  // RAM bottleneck
  if (spec.ramTotal < 8) {
    bn.push({ component: 'RAM', severity: 'critical', description: `${spec.ramTotal}GB RAM — below minimum for gaming`, impact: 'Constant stuttering, crashes', fix: 'Upgrade to 16GB DDR4/DDR5' })
  } else if (spec.ramTotal < 16) {
    bn.push({ component: 'RAM', severity: 'warning', description: `${spec.ramTotal}GB RAM — works but limited`, impact: 'Background apps cause stutter', fix: 'Upgrade to 16GB, close all background apps' })
  }

  const ramPct = spec.ramTotal > 0 ? (spec.ramUsed / spec.ramTotal) * 100 : 0
  if (ramPct > 85) {
    bn.push({ component: 'RAM', severity: 'warning', description: `RAM usage at ${Math.round(ramPct)}% — very little headroom`, impact: 'System will swap to disk, causing stutter', fix: 'Close memory-heavy apps or upgrade RAM' })
  }

  // Storage
  const sysDrive = spec.diskDrives.find(d => d.letter === 'C:')
  if (sysDrive && sysDrive.freeGB < 20) {
    bn.push({ component: 'Storage', severity: 'warning', description: `Only ${Math.round(sysDrive.freeGB)}GB free on C:`, impact: 'Windows slowdowns, game install failures', fix: 'Free up disk space or add storage' })
  }

  // Network
  if (spec.networkLatency && spec.networkLatency > 50) {
    bn.push({ component: 'Network', severity: 'warning', description: `Ping ${spec.networkLatency}ms is high for online gaming`, impact: 'Rubber-banding, delayed hit registration', fix: 'Use Ethernet, close bandwidth apps, use QoS' })
  } else if (spec.networkLatency && spec.networkLatency > 100) {
    bn.push({ component: 'Network', severity: 'critical', description: `Ping ${spec.networkLatency}ms — unplayable for competitive`, impact: 'Severe lag, cannot react in time', fix: 'Use wired Ethernet, check ISP, use VPN' })
  }

  // System
  if (spec.powerPlan !== 'High performance' && spec.powerPlan !== 'Ultimate Performance') {
    bn.push({ component: 'CPU', severity: 'info', description: `Power plan "${spec.powerPlan}" limits CPU performance`, impact: 'CPU throttles under load', fix: 'Switch to High Performance power plan' })
  }

  if (!spec.gameMode) {
    bn.push({ component: 'CPU', severity: 'info', description: 'Game Mode is disabled', impact: 'Windows may interrupt game with updates', fix: 'Enable Game Mode in Windows Settings' })
  }

  if (spec.bgProcesses > 40) {
    bn.push({ component: 'RAM', severity: 'info', description: `${spec.bgProcesses} background processes running`, impact: 'Wasting RAM and CPU cycles', fix: 'Disable startup programs, close unnecessary apps' })
  }

  return bn
}

function generateRecs(spec: SystemSpec, game?: GameProfile): Rec[] {
  const recs: Rec[] = []
  let id = 0
  const cpu = spec.cpuModel.toLowerCase()
  const gpu = spec.gpuModel.toLowerCase()
  const isNvidia = gpu.includes('nvidia') || gpu.includes('geforce') || gpu.includes('rtx') || gpu.includes('gtx')
  const isAmdGpu = gpu.includes('radeon') || gpu.includes('rx')
  const isHighEnd = spec.cpuCores >= 8 && spec.cpuMaxClock >= 4000
  const ramGB = spec.ramTotal

  // ── POWER ──
  if (spec.powerPlan !== 'High performance' && spec.powerPlan !== 'Ultimate Performance') {
    recs.push({ id: `r${++id}`, category: 'Power Plan', setting: 'Power Plan', current: spec.powerPlan, recommended: 'High Performance', reason: 'Prevents CPU throttling. Maintains max clock speeds during gaming.', fpsGain: [5, 15], risk: 'None', reversible: true, tweakId: 'sys-high-performance', priority: 10 })
  }

  // ── WINDOWS ──
  if (spec.gameMode === false) {
    recs.push({ id: `r${++id}`, category: 'Windows', setting: 'Game Mode', current: 'Disabled', recommended: 'Enabled', reason: 'Prioritizes game processes and blocks Windows Update interruptions.', fpsGain: [1, 3], risk: 'None', reversible: true, tweakId: 'sys-enable-game-mode', priority: 5 })
  }
  recs.push({ id: `r${++id}`, category: 'Windows', setting: 'Fullscreen Optimizations', current: 'Enabled', recommended: 'Disabled for game exe', reason: 'Prevents DWM overlay from adding latency in exclusive fullscreen.', fpsGain: [1, 4], risk: 'None', reversible: true, tweakId: 'sys-disable-fullscreen-opt', priority: 6 })
  recs.push({ id: `r${++id}`, category: 'Windows', setting: 'Visual Effects', current: 'Let Windows choose', recommended: 'Best Performance', reason: 'Disables transparency, animations — frees GPU/CPU for games.', fpsGain: [2, 8], risk: 'None', reversible: true, tweakId: 'sys-visual-effects', priority: 7 })
  recs.push({ id: `r${++id}`, category: 'Windows', setting: 'Notifications', current: 'Enabled', recommended: 'Disabled while gaming', reason: 'Prevents notification popups from stealing focus.', fpsGain: [1, 3], risk: 'None', reversible: true, tweakId: 'windows-notification-optimization', priority: 3 })
  recs.push({ id: `r${++id}`, category: 'Windows', setting: 'Animations', current: 'Enabled', recommended: 'Disabled', reason: 'Eliminates window animation overhead.', fpsGain: [1, 2], risk: 'None', reversible: true, tweakId: 'windows-animation-optimization', priority: 2 })

  // ── BACKGROUND ──
  recs.push({ id: `r${++id}`, category: 'Background', setting: 'Background Apps', current: `${spec.bgProcesses} processes`, recommended: 'Minimal', reason: `${spec.bgProcesses} processes consuming resources.`, fpsGain: spec.bgProcesses > 50 ? [5, 20] : [2, 8], risk: 'None', reversible: true, tweakId: 'debloat-remove-background', priority: 8, bottleneck: 'RAM' })
  if (spec.startupCount > 5) {
    recs.push({ id: `r${++id}`, category: 'Startup', setting: 'Startup Programs', current: `${spec.startupCount} programs`, recommended: '< 5', reason: `${spec.startupCount} programs slow boot and consume RAM.`, fpsGain: [2, 8], risk: 'None', reversible: true, tweakId: 'debloat-disable-startup', priority: 5 })
  }
  recs.push({ id: `r${++id}`, category: 'Background', setting: 'SysMain/Superfetch', current: 'Running', recommended: 'Disabled', reason: 'Preloads apps into RAM, competing with games.', fpsGain: [2, 6], risk: 'None', reversible: true, tweakId: 'debloat-superfetch', priority: 4 })

  // ── NVIDIA ──
  if (isNvidia) {
    recs.push({ id: `r${++id}`, category: 'NVIDIA', setting: 'Power Management', current: 'Optimal Power', recommended: 'Max Performance', reason: 'Prevents GPU clock drops during intense scenes.', fpsGain: [3, 12], risk: 'None', reversible: true, tweakId: 'nv-max-power', priority: 9, bottleneck: 'GPU' })
    recs.push({ id: `r${++id}`, category: 'NVIDIA', setting: 'V-Sync', current: 'Enabled', recommended: 'Off', reason: 'Driver V-Sync adds input lag.', fpsGain: [1, 5], risk: 'None', reversible: true, tweakId: 'nv-disable-vsync', priority: 6 })
    recs.push({ id: `r${++id}`, category: 'NVIDIA', setting: 'Low Latency Mode', current: 'Off', recommended: 'On', reason: 'Reduces render queue delay.', fpsGain: [0, 2], risk: 'None', reversible: true, tweakId: 'nv-low-latency', priority: 5 })
    recs.push({ id: `r${++id}`, category: 'NVIDIA', setting: 'Texture Filtering', current: 'Quality', recommended: 'High Performance', reason: 'Reduces filtering overhead with minimal visual loss.', fpsGain: [2, 6], risk: 'None', reversible: true, tweakId: 'nv-texture-filtering', priority: 4 })
    recs.push({ id: `r${++id}`, category: 'NVIDIA', setting: 'Shader Cache', current: 'Unknown', recommended: 'On', reason: 'Pre-compiles shaders to prevent stuttering.', fpsGain: [1, 5], risk: 'None', reversible: true, tweakId: 'nv-optimize-shader-cache', priority: 4 })
    if (spec.gpuVram >= 8) {
      recs.push({ id: `r${++id}`, category: 'NVIDIA', setting: 'HW Scheduling', current: 'Unknown', recommended: 'Enabled', reason: 'GPU manages its own memory scheduling.', fpsGain: [1, 5], risk: 'None', reversible: true, tweakId: 'nv-hardware-scheduling', priority: 3 })
    }
  }

  if (isAmdGpu) {
    recs.push({ id: `r${++id}`, category: 'AMD', setting: 'Radeon Chill', current: 'Unknown', recommended: 'Off', reason: 'Chill caps FPS to save power.', fpsGain: [5, 20], risk: 'None', reversible: true, priority: 8 })
    recs.push({ id: `r${++id}`, category: 'AMD', setting: 'Anti-Lag', current: 'Unknown', recommended: 'On', reason: 'Reduces CPU-GPU frame pacing delay.', fpsGain: [0, 3], risk: 'None', reversible: true, priority: 5 })
  }

  // ── CPU ──
  recs.push({ id: `r${++id}`, category: 'CPU', setting: 'Core Parking', current: 'Unknown', recommended: 'All cores active', reason: 'Parked cores cause frame drops.', fpsGain: [3, 12], risk: 'None', reversible: true, tweakId: 'cpu-core-parking-disable', priority: 8, bottleneck: 'CPU' })
  recs.push({ id: `r${++id}`, category: 'CPU', setting: 'SMT/Hyper-Threading', current: 'Unknown', recommended: 'Enabled', reason: 'More logical cores = better multithreaded perf.', fpsGain: [2, 8], risk: 'None', reversible: true, tweakId: 'cpu-smt-enable', priority: 5 })
  recs.push({ id: `r${++id}`, category: 'CPU', setting: 'Process Priority', current: 'Normal', recommended: 'High', reason: 'Game gets CPU priority over background.', fpsGain: [3, 10], risk: 'Low', reversible: true, tweakId: 'sys-cpu-priority', priority: 7 })

  // ── GPU ──
  recs.push({ id: `r${++id}`, category: 'GPU', setting: 'GPU Driver', current: 'Unknown', recommended: 'Latest Game Ready', reason: 'Game-specific optimizations and bug fixes.', fpsGain: [2, 10], risk: 'None', reversible: true, priority: 6, bottleneck: 'GPU' })

  // ── RAM ──
  recs.push({ id: `r${++id}`, category: 'RAM', setting: 'Memory Cleaner', current: 'Idle pages', recommended: 'Cleaned', reason: 'Frees stale memory for games.', fpsGain: [2, 8], risk: 'None', reversible: true, tweakId: 'memory-wake-cleaner', priority: 5, bottleneck: 'RAM' })
  if (ramGB <= 8) {
    recs.push({ id: `r${++id}`, category: 'RAM', setting: 'Page File', current: 'System Managed', recommended: '1.5x RAM', reason: 'Low RAM systems need proper page file.', fpsGain: [3, 10], risk: 'Low', reversible: true, tweakId: 'memory-pagefile-manager', priority: 7, bottleneck: 'RAM' })
  }
  recs.push({ id: `r${++id}`, category: 'RAM', setting: 'Page Prefetch', current: 'Default', recommended: 'Optimized', reason: 'Optimizes preload at boot.', fpsGain: [1, 4], risk: 'None', reversible: true, tweakId: 'memory-page-prefetch', priority: 3 })

  // ── STORAGE ──
  recs.push({ id: `r${++id}`, category: 'Storage', setting: 'TRIM', current: 'Unknown', recommended: 'Enabled', reason: 'Maintains SSD performance.', fpsGain: [0, 2], risk: 'None', reversible: true, tweakId: 'storage-trim-optimization', priority: 2 })
  recs.push({ id: `r${++id}`, category: 'Storage', setting: 'Write Cache', current: 'Unknown', recommended: 'Enabled', reason: 'Buffers writes in RAM.', fpsGain: [1, 4], risk: 'None', reversible: true, tweakId: 'storage-write-cache', priority: 3 })
  recs.push({ id: `r${++id}`, category: 'Storage', setting: 'Temp Cleanup', current: 'Unknown', recommended: 'Clean', reason: 'Removes temp files slowing disk.', fpsGain: [0, 3], risk: 'None', reversible: true, tweakId: 'storage-temp-file-cleaner', priority: 2 })

  // ── NETWORK ──
  recs.push({ id: `r${++id}`, category: 'Network', setting: 'DNS', current: 'ISP default', recommended: 'Cloudflare/Google', reason: 'Faster DNS = faster server connections.', fpsGain: [0, 0], risk: 'None', reversible: true, tweakId: 'net-optimize-dns', priority: 3 })
  recs.push({ id: `r${++id}`, category: 'Network', setting: 'Background Updates', current: 'Enabled', recommended: 'Disabled while gaming', reason: 'Updates steal bandwidth during matches.', fpsGain: [0, 0], risk: 'None', reversible: true, tweakId: 'net-disable-background-updates', priority: 4 })
  recs.push({ id: `r${++id}`, category: 'Network', setting: 'TCP Reset', current: 'Unknown', recommended: 'Reset', reason: 'Clears corrupted TCP state.', fpsGain: [0, 0], risk: 'None', reversible: true, tweakId: 'net-reset-tcp', priority: 2 })

  if (spec.networkLatency && spec.networkLatency > 30) {
    recs.push({ id: `r${++id}`, category: 'Network', setting: 'Latency', current: `${spec.networkLatency}ms`, recommended: '< 20ms', reason: `Ping is ${spec.networkLatency}ms. Use Ethernet.`, fpsGain: [0, 0], risk: 'None', reversible: true, priority: 7 })
  }

  // ── MOUSE ──
  if (spec.mouseAccel) {
    recs.push({ id: `r${++id}`, category: 'GPU', setting: 'Mouse Acceleration', current: 'ON', recommended: 'OFF', reason: 'Inconsistent aiming. Raw input = 1:1 movement.', fpsGain: [0, 0], risk: 'None', reversible: true, tweakId: 'mouse-disable-acceleration', priority: 6 })
  }
  recs.push({ id: `r${++id}`, category: 'GPU', setting: 'Raw Input', current: 'Default', recommended: 'Forced ON', reason: 'Bypasses Windows mouse processing.', fpsGain: [0, 0], risk: 'None', reversible: true, tweakId: 'mouse-raw-input', priority: 5 })

  // ── BIOS ──
  if (isHighEnd) {
    recs.push({ id: `r${++id}`, category: 'BIOS', setting: 'XMP/EXPO', current: 'JEDEC', recommended: 'Enabled', reason: 'RAM runs at default 2133MHz. XMP unlocks rated speed.', fpsGain: [5, 20], risk: 'Low', reversible: true, priority: 8 })
    recs.push({ id: `r${++id}`, category: 'BIOS', setting: 'Resizable BAR', current: 'Unknown', recommended: 'Enabled', reason: 'Lets CPU access full GPU VRAM.', fpsGain: [2, 10], risk: 'Low', reversible: true, priority: 6 })
  }

  // ── ADVANCED ──
  if (isHighEnd) {
    recs.push({ id: `r${++id}`, category: 'Advanced', setting: 'Timer Resolution', current: '15.6ms', recommended: '0.5ms', reason: 'Higher precision reduces input polling delay.', fpsGain: [0, 2], risk: 'Low', reversible: true, priority: 3 })
    recs.push({ id: `r${++id}`, category: 'Advanced', setting: 'HPET', current: 'Enabled', recommended: 'Disabled', reason: 'HPET can cause micro-stutters.', fpsGain: [1, 5], risk: 'Medium', reversible: true, advanced: true, priority: 4 })
  }

  // ── GAME ──
  if (game) {
    const r = game.recommended
    Object.entries(r).forEach(([key, val]) => {
      if (val === 'Off' || val === 'Low') {
        const fpsMap: Record<string, [number, number]> = {
          'Ray Tracing': [15, 60], 'Effects': [3, 12], 'Post Process': [2, 8], 'Shadows': [3, 15],
          'AA': [2, 10], 'VSync': [1, 5], 'Motion Blur': [1, 3],
        }
        recs.push({ id: `r${++id}`, category: 'Game Settings', setting: key, current: 'High/Epic', recommended: val, reason: `${key} at ${val} improves FPS significantly.`, fpsGain: fpsMap[key] || [1, 5], risk: 'None', reversible: true, priority: 8 })
      }
    })

    if (r.DLSS && r.DLSS !== 'Off') {
      recs.push({ id: `r${++id}`, category: 'Game Settings', setting: 'DLSS / FSR', current: 'Off', recommended: r.DLSS, reason: 'AI upscaling = huge FPS with minimal quality loss.', fpsGain: [10, 40], risk: 'None', reversible: true, priority: 10 })
    }
    if (r['Render Scale'] && r['Render Scale'] !== '100%') {
      recs.push({ id: `r${++id}`, category: 'Game Settings', setting: 'Render Scale', current: '100%', recommended: r['Render Scale'], reason: 'Lower render scale + DLSS = massive FPS.', fpsGain: [5, 30], risk: 'None', reversible: true, priority: 9 })
    }
    if (game.launchOptions) {
      recs.push({ id: `r${++id}`, category: 'Game Launch', setting: 'Launch Options', current: 'None', recommended: game.launchOptions, reason: 'Engine-specific launch parameters.', fpsGain: [2, 8], risk: 'Low', reversible: true, priority: 5 })
    }
    if (game.gpuIntensive) {
      recs.push({ id: `r${++id}`, category: 'Game Engine', setting: 'GPU Memory', current: 'Auto', recommended: 'High', reason: 'Pre-loads textures to prevent streaming stutter.', fpsGain: [2, 8], risk: 'Low', reversible: true, priority: 4 })
    }
  }

  return recs.sort((a, b) => b.priority - a.priority)
}

// ── SVG Radar Chart ──
function RadarChart({ spec }: { spec: SystemSpec }) {
  const metrics = useMemo(() => {
    const cpuScore = Math.min(100, (spec.cpuCores / 16) * 50 + (spec.cpuMaxClock / 5500) * 50)
    const gpuScore = Math.min(100, (spec.gpuVram / 24) * 100)
    const ramScore = Math.min(100, (spec.ramTotal / 64) * 100)
    const diskScore = Math.min(100, spec.diskDrives.length > 0 ? (spec.diskDrives.reduce((s, d) => s + d.sizeGB, 0) / 4000) * 100 : 10)
    const netScore = spec.networkLatency ? Math.max(0, 100 - spec.networkLatency) : 50
    const sysScore = (spec.powerPlan === 'High performance' ? 30 : 0) + (spec.gameMode ? 30 : 0) + (spec.bgProcesses < 30 ? 20 : 0) + (!spec.mouseAccel ? 20 : 0)
    return [
      { label: 'CPU', value: Math.round(cpuScore) },
      { label: 'GPU', value: Math.round(gpuScore) },
      { label: 'RAM', value: Math.round(ramScore) },
      { label: 'Disk', value: Math.round(diskScore) },
      { label: 'Net', value: Math.round(netScore) },
      { label: 'Sys', value: Math.round(sysScore) },
    ]
  }, [spec])

  const cx = 100, cy = 100, r = 70
  const n = metrics.length
  const angleStep = (Math.PI * 2) / n

  const getPoint = (i: number, val: number) => {
    const angle = angleStep * i - Math.PI / 2
    const dist = (val / 100) * r
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) }
  }

  const polygonPoints = metrics.map((m, i) => {
    const p = getPoint(i, m.value)
    return `${p.x},${p.y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {[25, 50, 75, 100].map(pct => (
        <polygon key={pct} points={metrics.map((_, i) => { const p = getPoint(i, pct); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke="var(--border-subtle)" strokeWidth="0.5" />
      ))}
      {metrics.map((_, i) => {
        const p = getPoint(i, 100)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border-subtle)" strokeWidth="0.5" />
      })}
      <polygon points={polygonPoints} fill="var(--accent)" fillOpacity="0.15" stroke="var(--accent)" strokeWidth="1.5" />
      {metrics.map((m, i) => {
        const p = getPoint(i, 115)
        return (
          <g key={i}>
            <circle cx={getPoint(i, m.value).x} cy={getPoint(i, m.value).y} r="3" fill="var(--accent)" />
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="600" fill="var(--text-primary)">{m.label}</text>
            <text x={getPoint(i, m.value).x} y={getPoint(i, m.value).y - 8} textAnchor="middle" fontSize="7" fill="var(--accent)">{m.value}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function AIOptimizerPage() {
  const [spec, setSpec] = useState<SystemSpec | null>(null)
  const [scanning, setScanning] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string>('')
  const [customGame, setCustomGame] = useState('')
  const [result, setResult] = useState<Rec[] | null>(null)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [appliedTweaks, setAppliedTweaks] = useState<Set<string>>(new Set())
  const [showBottlenecks, setShowBottlenecks] = useState(true)
  const resultRef = useRef<HTMLDivElement>(null)

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
  const bottlenecks = useMemo(() => spec ? detectBottlenecks(spec, game) : [], [spec, game])

  const runAnalysis = () => {
    if (!spec) return
    const recs = generateRecs(spec, game)
    setResult(recs)
    setShowBottlenecks(true)
    if (recs.length > 0) setExpandedCat(recs[0].category)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const applyTweak = async (tweakId: string) => {
    if (!window.electronAPI?.applyTweak) return
    try {
      await window.electronAPI.applyTweak(tweakId)
      setAppliedTweaks(prev => new Set(prev).add(tweakId))
    } catch {}
  }

  const applyAllSafe = async () => {
    if (!result) return
    for (const rec of result) {
      if (rec.tweakId && rec.risk !== 'High' && rec.risk !== 'Medium' && !appliedTweaks.has(rec.tweakId)) {
        await applyTweak(rec.tweakId)
      }
    }
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

  const gameFps = useMemo(() => {
    if (!spec || !game) return null
    return game.estimatedFps(spec)
  }, [spec, game])

  const score = useMemo(() => {
    if (!spec) return 0
    let s = 40
    if (spec.powerPlan === 'High performance' || spec.powerPlan === 'Ultimate Performance') s += 10
    if (spec.gameMode) s += 5
    if (spec.cpuCores >= 8) s += 10
    else if (spec.cpuCores >= 6) s += 5
    if (spec.ramTotal >= 16) s += 10
    else if (spec.ramTotal >= 8) s += 5
    if (spec.gpuVram >= 8) s += 10
    else if (spec.gpuVram >= 4) s += 5
    if (!spec.mouseAccel) s += 5
    if (spec.bgProcesses < 30) s += 5
    if (spec.networkLatency && spec.networkLatency < 20) s += 5
    return Math.min(s, 100)
  }, [spec])

  const exportReport = () => {
    if (!result || !spec) return
    let report = `CHOATIX AI FPS OPTIMIZER REPORT\n${'='.repeat(40)}\n\n`
    report += `HARDWARE:\nCPU: ${spec.cpuModel} (${spec.cpuCores}C/${spec.cpuThreads}T @ ${spec.cpuMaxClock}MHz)\nGPU: ${spec.gpuModel} (${spec.gpuVram}GB)\nRAM: ${spec.ramTotal}GB\nOS: ${spec.osVersion}\n\n`
    if (game) report += `GAME: ${game.name}\nEstimated FPS: ${gameFps ? `${gameFps[0]}-${gameFps[1]}` : 'N/A'}\n\n`
    report += `PERFORMANCE SCORE: ${score}/100\n\nPOTENTIAL GAINS:\nFPS: +${totals.fpsMin}-${totals.fpsMax}\n1% Low: +${totals.lowMin}-${totals.lowMax}%\nLatency: -${totals.latMin}-${totals.latMax}ms\n\n`
    report += `RECOMMENDATIONS (${result.length} total):\n${'-'.repeat(30)}\n`
    result.forEach(r => {
      report += `\n[${r.category}] ${r.setting}\nCurrent: ${r.current} → Recommended: ${r.recommended}\nFPS: +${r.fpsGain[0]}-${r.fpsGain[1]} | Risk: ${r.risk} | ${r.reason}\n`
    })
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `choatix-optimizer-report-${Date.now()}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: 'thin' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <Bot className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>AI FPS Optimizer</h1>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Auto-detect hardware • Game profiles • One-click optimization</p>
          </div>
        </div>
        {result && (
          <button onClick={exportReport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-semibold" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
            <Download className="w-3 h-3" /> Export Report
          </button>
        )}
      </div>

      {/* Hardware + Radar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Detected Hardware</div>
            <button onClick={detect} disabled={scanning} className="text-[10px] px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
              {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              {scanning ? 'Scanning...' : 'Rescan'}
            </button>
          </div>
          {spec ? (
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <Cpu className="w-3 h-3" />, label: 'CPU', value: spec.cpuModel, sub: `${spec.cpuCores}C / ${spec.cpuThreads}T / ${spec.cpuMaxClock}MHz / ${Math.round(spec.cpuUsage)}%` },
                { icon: <Monitor className="w-3 h-3" />, label: 'GPU', value: spec.gpuModel, sub: `${spec.gpuVram}GB VRAM • ${spec.gpuVendor}` },
                { icon: <Zap className="w-3 h-3" />, label: 'RAM', value: `${spec.ramTotal} GB`, sub: `${Math.round(spec.ramUsed)}GB used / ${spec.ramTotal}GB` },
                { icon: <Settings className="w-3 h-3" />, label: 'System', value: spec.powerPlan, sub: `GM: ${spec.gameMode ? 'On' : 'Off'} • ${spec.bgProcesses} bg procs` },
              ].map((item, i) => (
                <div key={i} className="p-2.5 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>
                    <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  </div>
                  <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
                  <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-[11px]" style={{ color: 'var(--text-muted)' }}>{scanning ? 'Scanning your hardware...' : 'Click Rescan to detect hardware'}</div>
          )}
        </div>

        {/* Radar */}
        <div className="p-4 rounded-xl flex flex-col items-center justify-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          {spec ? (
            <>
              <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>System Score</div>
              <div className="text-[28px] font-bold mb-1" style={{ color: score >= 70 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{score}</div>
              <div className="text-[9px] mb-2" style={{ color: 'var(--text-muted)' }}>/ 100</div>
              <div className="w-full h-32"><RadarChart spec={spec} /></div>
            </>
          ) : (
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Score appears after scan</div>
          )}
        </div>
      </div>

      {/* Bottlenecks */}
      {spec && bottlenecks.length > 0 && showBottlenecks && (
        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: 'var(--warning)' }} />
              <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Bottleneck Detection</div>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{bottlenecks.length}</span>
            </div>
            <button onClick={() => setShowBottlenecks(false)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}><X className="w-3 h-3" /></button>
          </div>
          <div className="space-y-2">
            {bottlenecks.map((bn, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="mt-0.5">
                  {bn.severity === 'critical' ? <Flame className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} /> :
                    bn.severity === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} /> :
                      <Info className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>{bn.component}</span>
                    <span className="text-[8px] px-1 py-0.5 rounded uppercase font-bold"
                      style={{ background: bn.severity === 'critical' ? '#ff000020' : bn.severity === 'warning' ? '#ffaa0020' : '#ffffff10', color: bn.severity === 'critical' ? 'var(--danger)' : bn.severity === 'warning' ? 'var(--warning)' : 'var(--text-muted)' }}>
                      {bn.severity}
                    </span>
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{bn.description}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Impact: {bn.impact} • Fix: {bn.fix}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Selector */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
        <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Game Profile</div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {GAMES.map(g => (
            <button key={g.id} onClick={() => setSelectedGame(selectedGame === g.id ? '' : g.id)}
              className="p-2.5 rounded-lg text-center transition-all"
              style={{
                background: selectedGame === g.id ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: selectedGame === g.id ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${selectedGame === g.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
              }}>
              <div className="text-[10px] font-semibold">{g.name}</div>
              <div className="text-[8px] mt-0.5 opacity-70">{g.tags[0]}</div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={customGame} onChange={e => setCustomGame(e.target.value)} placeholder="Or type any game name..."
            className="flex-1 px-3 py-2 rounded-lg text-[11px] outline-none" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
        </div>
        {game && (
          <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{game.name}</div>
              {gameFps && <div className="text-[11px] font-bold" style={{ color: 'var(--success)' }}>Est. {gameFps[0]}-{gameFps[1]} FPS</div>}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{game.settingsSummary}</div>
            {game.launchOptions && <div className="text-[9px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>Launch: {game.launchOptions}</div>}
          </div>
        )}
      </div>

      {/* Analyze */}
      {!result && (
        <button onClick={runAnalysis} disabled={!spec || scanning}
          className="w-full py-3.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#000' }}>
          <Sparkles className="w-4 h-4" />
          {scanning ? 'Analyzing...' : 'Analyze & Generate Optimizations'}
        </button>
      )}

      {/* Results */}
      {result && (
        <div ref={resultRef} className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'FPS Gain', value: `+${totals.fpsMin}-${totals.fpsMax}`, icon: <TrendingUp className="w-3.5 h-3.5" /> },
              { label: '1% Low', value: `+${totals.lowMin}-${totals.lowMax}%`, icon: <ArrowRight className="w-3.5 h-3.5" /> },
              { label: 'Latency', value: `-${totals.latMin}-${totals.latMax}ms`, icon: <Clock className="w-3.5 h-3.5" /> },
              { label: 'Score', value: `${score}/100`, icon: <Shield className="w-3.5 h-3.5" />, highlight: true },
              { label: 'Tweaks', value: `${result.length}`, icon: <Settings className="w-3.5 h-3.5" /> },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-center mb-1" style={{ color: 'var(--text-muted)' }}>{s.icon}</div>
                <div className="text-[16px] font-bold" style={{ color: s.highlight ? (score >= 70 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)') : 'var(--text-primary)' }}>{s.value}</div>
                <div className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span className="font-bold" style={{ color: 'var(--success)' }}>{appliedTweaks.size}</span> / {result.length} applied
              </div>
              <button onClick={applyAllSafe} disabled={appliedTweaks.size >= result.length}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'var(--accent)', color: '#000' }}>
                <Zap className="w-3 h-3" /> Apply All Safe
              </button>
            </div>
            <button onClick={() => { setResult(null); setSelectedGame(''); setCustomGame('') }}
              className="text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
              <RotateCcw className="w-3 h-3" /> Re-analyze
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            {Object.entries(grouped).map(([cat, recs]) => {
              const catApplied = recs.filter(r => r.tweakId && appliedTweaks.has(r.tweakId)).length
              const catFpsMin = Math.min(...recs.map(r => r.fpsGain[0]))
              const catFpsMax = Math.max(...recs.map(r => r.fpsGain[1]))
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
                        {catFpsMin > 0 || catFpsMax > 0 ? `+${catFpsMin}-${catFpsMax} FPS` : 'Latency'}
                      </span>
                      {expandedCat === cat ? <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </button>
                  {expandedCat === cat && (
                    <div className="px-4 pb-3 space-y-2">
                      {recs.map((rec) => {
                        const applied = !!(rec.tweakId && appliedTweaks.has(rec.tweakId))
                        return (
                          <div key={rec.id} className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', opacity: applied ? 0.5 : 1 }}>
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{rec.setting}</div>
                                {rec.bottleneck && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#ffaa0020', color: 'var(--warning)' }}>
                                    {rec.bottleneck} bottleneck
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {rec.advanced && <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#ff000020', color: 'var(--danger)' }}>ADVANCED</span>}
                                <span className="text-[8px] px-1.5 py-0.5 rounded"
                                  style={{ background: rec.risk === 'None' ? '#ffffff10' : rec.risk === 'Low' ? '#cccccc10' : '#ff000015', color: riskColor[rec.risk] }}>
                                  {rec.risk}
                                </span>
                                {rec.reversible && <span className="text-[8px]" style={{ color: 'var(--success)' }}>↩</span>}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-1.5">
                              <div>
                                <span className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>Current: </span>
                                <span className="text-[10px]" style={{ color: 'var(--danger)' }}>{rec.current}</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>Fix: </span>
                                <span className="text-[10px] font-semibold" style={{ color: 'var(--success)' }}>{rec.recommended}</span>
                              </div>
                            </div>
                            <div className="text-[10px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>{rec.reason}</div>
                            <div className="flex items-center justify-between">
                              <div className="text-[10px] font-bold" style={{ color: 'var(--success)' }}>
                                {rec.fpsGain[0] > 0 || rec.fpsGain[1] > 0 ? `+${rec.fpsGain[0]}-${rec.fpsGain[1]} FPS` : 'Latency only'}
                              </div>
                              {rec.tweakId && (
                                <button onClick={() => applyTweak(rec.tweakId!)} disabled={applied}
                                  className="px-3 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all"
                                  style={{ background: applied ? 'var(--bg-secondary)' : 'var(--accent)', color: applied ? 'var(--text-muted)' : '#000', opacity: applied ? 0.5 : 1 }}>
                                  {applied ? <><CheckCircle className="w-3 h-3" /> Done</> : 'Apply'}
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
  )
}

function Info(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> }
