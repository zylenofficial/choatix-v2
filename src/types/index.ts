export enum LicenseTier {
  FREE = 'FREE',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM'
}

export type TweakCategory = 'network' | 'nvidia' | 'debloat' | 'mouse' | 'keyboard' | 'system' | 'amd' | 'intel' | 'cpu' | 'memory' | 'storage' | 'windows' | 'gaming' | 'audio' | 'usb' | 'services'

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void
      maximize: () => void
      close: () => void
      scanSystem: () => Promise<ScanData>
      advisorScan: () => Promise<ScanData>
      setHighPerformance: () => Promise<{ success: boolean; previous: string }>
      setGameMode: (enabled: boolean) => Promise<{ success: boolean; previous: boolean | null }>
      getRealtimeStats: () => Promise<RealtimeStats>
      getDrives: () => Promise<DriveInfo[]>
      clearCache: () => Promise<{ success: boolean }>
      openDriverUpdate: () => Promise<{ success: boolean }>
      scanProcesses: () => Promise<{ processes: ProcessInfo[]; summary: ProcessSummary }>
      optimizeProcesses: (mode: 'safe' | 'aggressive') => Promise<{ success: boolean; killed: number; savedRam: number; mode: string; processes: ProcessInfo[] }>
      restoreProcesses: () => Promise<{ success: boolean; restored: number; message: string }>
      detectGames: (executables: string[]) => Promise<{ running: { name: string; pid: number }[] }>
      startAutopilot: (games: GameProfile[]) => Promise<{ success: boolean }>
      stopAutopilot: () => Promise<{ success: boolean }>
      getAutopilotStatus: () => Promise<{ active: boolean; currentGame: string | null; games: string[] }>
      onAutopilotEvent: (cb: (event: { type: string; game: string }) => void) => () => void
      runBenchmark: () => Promise<BenchmarkResult>
      getScheduledScans: () => Promise<{ scans: ScheduledScan[] }>
      scheduleScan: (scan: Omit<ScheduledScan, 'id' | 'lastRun' | 'nextRun'>) => Promise<{ success: boolean; scan: ScheduledScan }>
      unscheduleScan: (id: string) => Promise<{ success: boolean }>
      oneClickOptimize: () => Promise<{ success: boolean; applied: number; total: number }>
      checkForUpdates: () => Promise<UpdateInfo>
      reportCrash: (data: { error: string; stack: string; context: string }) => Promise<{ success: boolean }>
      exportSettings: () => Promise<{ success: boolean; data?: string; error?: string }>
      importSettings: (data: string) => Promise<{ success: boolean; error?: string }>
      saveSettingsToFile: () => Promise<{ success: boolean }>
      loadSettingsFromFile: () => Promise<{ success: boolean }>
      applyTweak: (tweakId: string) => Promise<{ success: boolean; error?: string }>
      restoreTweak: (tweakId: string) => Promise<{ success: boolean; error?: string }>
      restoreAll: () => Promise<{ success: boolean; restored: number }>
      isAdmin: () => Promise<boolean>
      onCrashEvent: (cb: (event: { error: string; stack: string }) => void) => void
      saveAppState: (state: any) => Promise<{ success: boolean }>
      loadAppState: () => Promise<{ success: boolean; state: any }>
      sendFeedback: (feedback: FeedbackData) => Promise<{ success: boolean; error?: string }>
      onSaveStateRequest: (cb: () => void) => void
      isElectron: boolean
    }
  }
}

export interface ProcessInfo {
  name: string
  pid: number
  ram: number
  status: 'safe' | 'aggressive' | 'critical' | 'running'
}

export interface ProcessSummary {
  total: number
  safe: number
  aggressive: number
  critical: number
  totalRam: number
}

export interface BenchmarkResult {
  success: boolean
  avgCpu: number
  avgRam: number
  maxCpu: number
  ramTotal: number
  diskReadMBs: number
  diskWriteMBs: number
  samples: number
  timestamp: number
  label?: string
}

export interface ScheduledScan {
  id: string
  name: string
  type: 'quick' | 'full' | 'optimize' | 'benchmark'
  intervalMs: number
  lastRun: number | null
  nextRun: number
  enabled: boolean
  tweaks?: string[]
}

export interface RealtimeStats {
  cpu: {
    usage: number
    temperature: number | null
    model: string
    cores: number
    threads: number
    clock: number
  }
  ram: {
    total: number
    used: number
    available: number
    percentage: number
  }
  gpu: {
    model: string
    usage: number
    vram: number
    temperature: number | null
    vendor: string
  }
  storage: {
    drives: DriveInfo[]
  }
  network: {
    downloadSpeed: number
    uploadSpeed: number
    adapterName: string
    ipAddress: string
    latencyMs: number | null
  }
  system: {
    powerPlan: string
    gameMode: string | boolean | null
    os: string
    uptime: string | number
    processes: number
  }
}

export interface DriveInfo {
  letter: string
  totalGB: number
  usedGB: number
  freeGB: number
  percentage: number
}

export interface LicenseInfo {
  tier: LicenseTier
  key: string | null
  activated: boolean
  expiryDate: Date | null
}

export interface SystemInfo {
  cpu: {
    model: string
    cores: number
    threads: number
    usage: number
    maxClockMhz: number
  }
  gpu: {
    model: string
    vram: number
    usage: number
    vendor: 'nvidia' | 'amd' | 'intel' | 'unknown'
  }
  ram: {
    total: number
    used: number
    available: number
  }
  disk: {
    total: number
    used: number
    available: number
    drives: { letter: string; sizeGB: number; freeGB: number }[]
  }
  os: {
    version: string
    build: string
    architecture: string
  }
  uptime: number
  powerPlan: string
  gameMode: boolean | null
  network: {
    latencyMs: number | null
    adapterName: string
  }
  startup: {
    count: number
    programs: string[]
  }
  processes: {
    total: number
    background: number
  }
  mouse: {
    name: string
    enhancePointerPrecision: boolean
    pollingRateDetected: boolean
  }
  keyboard: {
    filterKeys: boolean
    stickyKeys: boolean
    repeatDelay: string
  }
}

export interface ScanData {
  systemInfo: SystemInfo
}

export interface ScanIssue {
  id: string
  title: string
  description: string
  category: TweakCategory
  severity: 'low' | 'medium' | 'high'
  gamingImpact: string
  requiredTier: LicenseTier
  tweakId: string
}

export interface ScanResult {
  timestamp: Date
  systemInfo: SystemInfo
  issues: ScanIssue[]
  score: number
  systemClass: 'LOW' | 'MID' | 'HIGH' | 'STUTTER RISK'
}

export interface Tweak {
  id: string
  name: string
  description: string
  category: TweakCategory
  requiredTier: LicenseTier
  applied: boolean
  impact: 'low' | 'medium' | 'high'
  risk: 'none' | 'low' | 'medium'
  gamingImpact: string
}

export interface RollbackEntry {
  id: string
  tweakId: string
  timestamp: Date
  originalValue: any
  currentValue: any
  reverted: boolean
}

export interface GameProfile {
  id: string
  name: string
  executable: string
  tweaks: string[]
  priority: number
}

export interface PerformanceSnapshot {
  timestamp: Date
  fps?: number
  ping?: number
  cpuUsage: number
  ramUsage: number
  gpuUsage: number
}

export interface Feature {
  id: string
  name: string
  description: string
  tier: LicenseTier
  gamingImpact: string
  category: 'scan' | 'tweak' | 'autopilot' | 'undo'
}

// ─── Choatix Advisor Types ───

export type DeviceType = 'desktop' | 'laptop' | 'unknown'

export type SystemPerfClass = 'LOW' | 'MID' | 'HIGH' | 'STUTTER RISK'

export type AdvisorSeverity = 'low' | 'medium' | 'high'

export interface AdvisorIssue {
  id: string
  title: string
  description: string
  gamingImpact: string
  severity: AdvisorSeverity
  category: TweakCategory
  tweakId: string
  requiredTier: LicenseTier
  undoable: boolean
}

export interface AdvisorResult {
  timestamp: Date
  systemInfo: SystemInfo
  deviceType: DeviceType
  issues: AdvisorIssue[]
  score: number
  systemClass: SystemPerfClass
  optimizationCount: number
}

export type AdvisorScanPhase = 'cpu' | 'ram' | 'disk' | 'gpu' | 'network' | 'startup' | 'power' | 'analysis'

export interface AdvisorScanProgress {
  phase: AdvisorScanPhase
  phaseIndex: number
  totalPhases: number
  label: string
}

export interface ConfirmationModalState {
  isOpen: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
}

export interface UpdateInfo {
  updateAvailable: boolean
  currentVersion: string
  latestVersion: string
  downloadUrl: string
  releaseNotes: string
}

export interface HealthScoreEntry {
  score: number
  timestamp: number
}

export interface FeedbackData {
  type: 'bug' | 'feature' | 'general'
  subject: string
  message: string
  email?: string
  includeLogs: boolean
}
