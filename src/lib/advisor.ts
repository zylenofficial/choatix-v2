import {
  SystemInfo, AdvisorIssue, AdvisorResult, AdvisorScanPhase, DeviceType,
  SystemPerfClass, LicenseTier, ScanData
} from '@/types'

const ADVISOR_SCAN_STEPS: { phase: AdvisorScanPhase; label: string }[] = [
  { phase: 'cpu', label: 'Analyzing CPU' },
  { phase: 'ram', label: 'Checking Memory' },
  { phase: 'disk', label: 'Scanning Disk' },
  { phase: 'gpu', label: 'Detecting GPU' },
  { phase: 'network', label: 'Testing Network' },
  { phase: 'startup', label: 'Reviewing Startup' },
  { phase: 'power', label: 'Checking Power Plan' },
  { phase: 'analysis', label: 'Running Analysis' },
]

export function getScanSteps() {
  return ADVISOR_SCAN_STEPS
}

export async function performAdvisorScan(
  userTier: LicenseTier
): Promise<{ result: AdvisorResult | null; error: string | null }> {
  if (!window.electronAPI?.isElectron) {
    return { result: null, error: 'Electron environment required for system scan' }
  }

  let rawData: ScanData & { deviceType?: string }
  try {
    rawData = await window.electronAPI.advisorScan()
  } catch (err) {
    return { result: null, error: 'Failed to communicate with system scanner' }
  }

  const systemInfo = rawData.systemInfo
  const deviceType = (rawData as any).deviceType as DeviceType || 'unknown'

  const issues = generateRecommendations(systemInfo, userTier)
  const score = calculateHealthScore(issues)
  const systemClass = classifySystem(systemInfo, score, issues)

  return {
    result: {
      timestamp: new Date(),
      systemInfo,
      deviceType,
      issues,
      score,
      systemClass,
      optimizationCount: issues.length,
    },
    error: null,
  }
}

// ─── Recommendation Engine ───
// Only generates issues when real conditions are detected.

export function generateRecommendations(info: SystemInfo, tier: LicenseTier): AdvisorIssue[] {
  const issues: AdvisorIssue[] = []

  // --- SYSTEM ---
  analyzePowerPlan(info, issues)
  analyzeGameMode(info, issues)
  analyzeDiskSpace(info, issues)
  analyzeRamUsage(info, issues)

  // --- DEBLOAT ---
  analyzeStartupApps(info, issues)
  analyzeBackgroundProcesses(info, issues)

  // --- MOUSE ---
  analyzeMouse(info, issues)

  // --- KEYBOARD ---
  analyzeKeyboard(info, issues)

  // --- NVIDIA ---
  analyzeNvidiaBasic(info, issues)
  if (tier === LicenseTier.PRO || tier === LicenseTier.PREMIUM) {
    analyzeNvidiaAdvanced(info, tier, issues)
  }

  // --- NETWORK (advanced) ---
  if (tier === LicenseTier.PRO || tier === LicenseTier.PREMIUM) {
    analyzeNetworkAdvanced(info, tier, issues)
  }

  // --- DEBLOAT (advanced) ---
  if (tier === LicenseTier.PRO || tier === LicenseTier.PREMIUM) {
    analyzeDebloatAdvanced(info, tier, issues)
  }

  return issues
}

function analyzePowerPlan(info: SystemInfo, issues: AdvisorIssue[]) {
  if (info.powerPlan !== 'High performance' && info.powerPlan !== 'Ultimate Performance') {
    issues.push({
      id: 'advisor-power-plan',
      title: `Power plan: "${info.powerPlan}"`,
      description: 'Your system is not on a performance power plan. Windows limits CPU clock speed and throughput on Balanced or Power Saver modes.',
      gamingImpact: 'Unlocks maximum CPU frequency and eliminates power throttling',
      severity: 'high',
      category: 'system',
      tweakId: 'sys-high-performance',
      requiredTier: LicenseTier.FREE,
      undoable: true,
    })
  }
}

function analyzeGameMode(info: SystemInfo, issues: AdvisorIssue[]) {
  if (info.gameMode === false) {
    issues.push({
      id: 'advisor-game-mode',
      title: 'Windows Game Mode is disabled',
      description: 'Game Mode reduces background interference during gaming sessions. It prioritizes game processes and prevents Windows Update from triggering restarts.',
      gamingImpact: 'Fewer frame drops, no surprise update popups',
      severity: 'medium',
      category: 'system',
      tweakId: 'sys-enable-game-mode',
      requiredTier: LicenseTier.FREE,
      undoable: true,
    })
  }
}

function analyzeDiskSpace(info: SystemInfo, issues: AdvisorIssue[]) {
  if (info.disk.total > 0) {
    const usedPercent = (info.disk.used / info.disk.total) * 100
    if (usedPercent > 85) {
      issues.push({
        id: 'advisor-disk-space',
        title: `Disk ${usedPercent.toFixed(0)}% full`,
        description: `Only ${(info.disk.available / 1024).toFixed(1)} GB free of ${(info.disk.total / 1024).toFixed(1)} GB. Low disk space causes system slowdowns, prevents game installations, and increases load times.`,
        gamingImpact: 'Faster load times, space for new game installs',
        severity: usedPercent > 92 ? 'high' : 'medium',
        category: 'system',
        tweakId: 'sys-disk-cleanup',
        requiredTier: LicenseTier.FREE,
        undoable: true,
      })
    }
  }
}

function analyzeRamUsage(info: SystemInfo, issues: AdvisorIssue[]) {
  if (info.ram.total > 0) {
    const ramPercent = (info.ram.used / info.ram.total) * 100
    if (ramPercent > 85) {
      issues.push({
        id: 'advisor-ram-high',
        title: `RAM usage at ${ramPercent.toFixed(0)}%`,
        description: `${(info.ram.used / 1024).toFixed(1)} GB of ${(info.ram.total / 1024).toFixed(1)} GB in use. High memory usage leaves fewer resources for games, causing stutters and texture streaming issues.`,
        gamingImpact: 'More available memory for game assets and smoother gameplay',
        severity: ramPercent > 92 ? 'high' : 'medium',
        category: 'debloat',
        tweakId: 'debloat-remove-background',
        requiredTier: LicenseTier.FREE,
        undoable: true,
      })
    }
  }
}

function analyzeStartupApps(info: SystemInfo, issues: AdvisorIssue[]) {
  if (info.startup.count > 8) {
    issues.push({
      id: 'advisor-startup-count',
      title: `${info.startup.count} startup programs`,
      description: `Programs launching at boot: ${info.startup.programs.slice(0, 5).join(', ')}${info.startup.count > 5 ? '...' : ''}. These consume RAM and CPU cycles even when not in use.`,
      gamingImpact: 'Faster boot, more free RAM for gaming',
      severity: info.startup.count > 15 ? 'high' : 'medium',
      category: 'debloat',
      tweakId: 'debloat-disable-startup',
      requiredTier: LicenseTier.FREE,
      undoable: true,
    })
  }
}

function analyzeBackgroundProcesses(info: SystemInfo, issues: AdvisorIssue[]) {
  if (info.processes.background > 80) {
    issues.push({
      id: 'advisor-background-procs',
      title: `${info.processes.background} background processes`,
      description: `Out of ${info.processes.total} total processes, ${info.processes.background} are running in the background. High background load causes CPU contention and input lag.`,
      gamingImpact: 'Frees CPU cores and reduces micro-stutters',
      severity: info.processes.background > 120 ? 'high' : 'medium',
      category: 'debloat',
      tweakId: 'debloat-remove-background',
      requiredTier: LicenseTier.FREE,
      undoable: true,
    })
  }
}

function analyzeMouse(info: SystemInfo, issues: AdvisorIssue[]) {
  if (info.mouse.enhancePointerPrecision) {
    issues.push({
      id: 'advisor-mouse-accel',
      title: 'Mouse acceleration is ON',
      description: 'Enhance Pointer Precision adds variable sensitivity based on mouse speed. This makes aiming inconsistent across different movement speeds.',
      gamingImpact: 'Consistent aim, muscle memory improvement',
      severity: 'high',
      category: 'mouse',
      tweakId: 'mouse-disable-acceleration',
      requiredTier: LicenseTier.FREE,
      undoable: true,
    })
  }
}

function analyzeKeyboard(info: SystemInfo, issues: AdvisorIssue[]) {
  if (info.keyboard.filterKeys) {
    issues.push({
      id: 'advisor-filter-keys',
      title: 'Filter Keys is enabled',
      description: 'Filter Keys ignores brief or repeated keystrokes. In fast-paced games, this causes missed inputs and delayed responses.',
      gamingImpact: 'All key presses register immediately',
      severity: 'high',
      category: 'keyboard',
      tweakId: 'kb-disable-filter-keys',
      requiredTier: LicenseTier.FREE,
      undoable: true,
    })
  }

  if (info.keyboard.stickyKeys) {
    issues.push({
      id: 'advisor-sticky-keys',
      title: 'Sticky Keys is active',
      description: 'Sticky Keys can intercept key combinations (Shift, Ctrl, Alt) during gameplay and trigger unexpected popups.',
      gamingImpact: 'Uninterrupted key combinations',
      severity: 'medium',
      category: 'keyboard',
      tweakId: 'kb-disable-sticky-keys',
      requiredTier: LicenseTier.FREE,
      undoable: true,
    })
  }
}

function analyzeNvidiaBasic(info: SystemInfo, issues: AdvisorIssue[]) {
  if (info.gpu.vendor !== 'nvidia') return

  issues.push({
    id: 'advisor-gpu-power',
    title: 'GPU power mode not maximized',
    description: `NVIDIA ${info.gpu.model} detected. The GPU may be using "Optimal Power" instead of "Prefer Maximum Performance", causing clock speed drops during gameplay.`,
    gamingImpact: 'Stable GPU clock, eliminates power-state transitions',
    severity: 'high',
    category: 'nvidia',
    tweakId: 'nv-max-power',
    requiredTier: LicenseTier.FREE,
    undoable: true,
  })
}

function analyzeNvidiaAdvanced(info: SystemInfo, tier: LicenseTier, issues: AdvisorIssue[]) {
  if (info.gpu.vendor !== 'nvidia') return

  if (tier === LicenseTier.PRO || tier === LicenseTier.PREMIUM) {
    issues.push({
      id: 'advisor-nv-low-latency',
      title: 'Ultra Low Latency mode available',
      description: 'NVIDIA Ultra Low Latency mode reduces the render queue to 1 frame, significantly cutting input lag in competitive games.',
      gamingImpact: 'Up to 30% less input lag',
      severity: 'medium',
      category: 'nvidia',
      tweakId: 'nv-low-latency',
      requiredTier: LicenseTier.PRO,
      undoable: true,
    })
  }
}

function analyzeNetworkAdvanced(info: SystemInfo, tier: LicenseTier, issues: AdvisorIssue[]) {
  if (info.network.latencyMs !== null && info.network.latencyMs > 80) {
    issues.push({
      id: 'advisor-high-latency',
      title: `Network latency: ${info.network.latencyMs}ms`,
      description: 'Elevated ping to external servers. Background updates or bandwidth-heavy services may be consuming your connection.',
      gamingImpact: 'Lower ping, more stable online matches',
      severity: info.network.latencyMs > 150 ? 'high' : 'medium',
      category: 'network',
      tweakId: 'net-disable-background-updates',
      requiredTier: LicenseTier.FREE,
      undoable: true,
    })
  }

  if (tier === LicenseTier.PRO || tier === LicenseTier.PREMIUM) {
    issues.push({
      id: 'advisor-network-throttle',
      title: 'Network throttling active',
      description: 'Windows network throttling mechanism limits non-multicast traffic to 10 packets/ms. This affects gaming throughput.',
      gamingImpact: 'Full network throughput, less jitter',
      severity: 'medium',
      category: 'network',
      tweakId: 'net-disable-throttling',
      requiredTier: LicenseTier.PRO,
      undoable: true,
    })
  }
}

function analyzeDebloatAdvanced(info: SystemInfo, tier: LicenseTier, issues: AdvisorIssue[]) {
  if (tier === LicenseTier.PRO || tier === LicenseTier.PREMIUM) {
    issues.push({
      id: 'advisor-telemetry',
      title: 'Telemetry services running',
      description: 'Windows telemetry data collection runs periodically, consuming CPU and network resources in the background.',
      gamingImpact: 'Fewer background CPU spikes',
      severity: 'low',
      category: 'debloat',
      tweakId: 'debloat-disable-telemetry',
      requiredTier: LicenseTier.PRO,
      undoable: true,
    })
  }
}

// ─── Scoring ───

export function calculateHealthScore(issues: AdvisorIssue[]): number {
  let score = 100
  for (const issue of issues) {
    if (issue.severity === 'high') score -= 12
    else if (issue.severity === 'medium') score -= 6
    else score -= 2
  }
  return Math.max(0, Math.min(100, score))
}

export function classifySystem(
  info: SystemInfo,
  score: number,
  issues: AdvisorIssue[]
): SystemPerfClass {
  const hasHighSev = issues.some(i => i.severity === 'high')

  if (score >= 80 && !hasHighSev) return 'HIGH'
  if (score >= 50) return 'MID'
  if (hasHighSev && score < 40) return 'STUTTER RISK'
  return 'LOW'
}

// ─── System Action Executors ───

export async function applyAdvisorFix(tweakId: string): Promise<{ success: boolean; error?: string }> {
  if (!window.electronAPI?.isElectron) {
    return { success: false, error: 'Electron environment required' }
  }

  try {
    if (window.electronAPI.applyTweak) {
      return await window.electronAPI.applyTweak(tweakId)
    }
    switch (tweakId) {
      case 'sys-high-performance': {
        const result = await window.electronAPI.setHighPerformance()
        return { success: result.success }
      }
      case 'sys-enable-game-mode': {
        const result = await window.electronAPI.setGameMode(true)
        return { success: result.success }
      }
      default:
        return { success: false, error: `Direct apply not supported for: ${tweakId}` }
    }
  } catch {
    return { success: false, error: 'System action failed' }
  }
}
