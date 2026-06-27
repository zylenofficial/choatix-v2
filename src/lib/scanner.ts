import { SystemInfo, ScanResult, ScanIssue, LicenseTier, TweakCategory } from '@/types'

export async function scanSystem(userTier: LicenseTier = LicenseTier.FREE): Promise<ScanResult> {
  let systemInfo: SystemInfo

  if (window.electronAPI?.isElectron) {
    const result = await window.electronAPI.scanSystem()
    systemInfo = result.systemInfo
  } else {
    return {
      timestamp: new Date(),
      systemInfo: {} as SystemInfo,
      issues: [],
      score: 0,
      systemClass: 'LOW',
    }
  }

  const issues: ScanIssue[] = []
  analyzeNetwork(systemInfo, userTier, issues)
  analyzeNvidia(systemInfo, userTier, issues)
  analyzeDebloat(systemInfo, userTier, issues)
  analyzeMouse(systemInfo, userTier, issues)
  analyzeKeyboard(systemInfo, userTier, issues)
  analyzeSystem(systemInfo, userTier, issues)

  const score = calculateScore(issues)
  const systemClass = getSystemClass(score, issues)

  return { timestamp: new Date(), systemInfo, issues, score, systemClass }
}

function analyzeNetwork(info: SystemInfo, tier: LicenseTier, issues: ScanIssue[]) {
  if (info.network.latencyMs !== null && info.network.latencyMs > 80) {
    issues.push({
      id: 'net-high-latency',
      title: 'High network latency detected',
      description: `Ping to Google DNS: ${info.network.latencyMs}ms. Online games may experience lag.`,
      category: 'network',
      severity: info.network.latencyMs > 150 ? 'high' : 'medium',
      gamingImpact: 'Latency reduction, ping stability',
      requiredTier: LicenseTier.FREE,
      tweakId: 'net-disable-background-updates',
    })
  }

  issues.push({
    id: 'net-background-updates',
    title: 'Background updates may consume bandwidth',
    description: 'Windows Update and other services can use bandwidth during gaming sessions.',
    category: 'network',
    severity: 'medium',
    gamingImpact: 'Stable ping, less packet loss',
    requiredTier: LicenseTier.FREE,
    tweakId: 'net-disable-background-updates',
  })

  issues.push({
    id: 'net-dns',
    title: 'DNS settings may not be optimized',
    description: 'Default ISP DNS servers may be slower than public alternatives.',
    category: 'network',
    severity: 'low',
    gamingImpact: 'Faster game server connections',
    requiredTier: LicenseTier.FREE,
    tweakId: 'net-optimize-dns',
  })

  if (tier === LicenseTier.PRO || tier === LicenseTier.PREMIUM) {
    issues.push({
      id: 'net-throttling',
      title: 'Network throttling may be active',
      description: 'Windows network throttling mechanism can limit throughput.',
      category: 'network',
      severity: 'medium',
      gamingImpact: 'Reduced network jitter',
      requiredTier: LicenseTier.PRO,
      tweakId: 'net-disable-throttling',
    })
  }
}

function analyzeNvidia(info: SystemInfo, tier: LicenseTier, issues: ScanIssue[]) {
  if (info.gpu.vendor === 'nvidia') {
    issues.push({
      id: 'nv-power-mode',
      title: 'GPU power mode may limit performance',
      description: `NVIDIA GPU detected: ${info.gpu.model}. Power management may not be set to maximum performance.`,
      category: 'nvidia',
      severity: 'high',
      gamingImpact: 'FPS stability, eliminates power throttling',
      requiredTier: LicenseTier.FREE,
      tweakId: 'nv-max-power',
    })

    issues.push({
      id: 'nv-vsync',
      title: 'V-Sync may cause input lag',
      description: 'Vertical sync adds frame delay. Disabling it reduces input latency.',
      category: 'nvidia',
      severity: 'medium',
      gamingImpact: 'Input lag reduction',
      requiredTier: LicenseTier.FREE,
      tweakId: 'nv-disable-vsync',
    })

    if (tier === LicenseTier.PRO || tier === LicenseTier.PREMIUM) {
      issues.push({
        id: 'nv-low-latency',
        title: 'Ultra Low Latency mode not enabled',
        description: 'NVIDIA Ultra Low Latency mode can reduce frame delay significantly.',
        category: 'nvidia',
        severity: 'high',
        gamingImpact: 'Reduced input lag by 20-30%',
        requiredTier: LicenseTier.PRO,
        tweakId: 'nv-low-latency',
      })
    }

    if (tier === LicenseTier.PREMIUM) {
      issues.push({
        id: 'nv-hw-schedule',
        title: 'Hardware GPU scheduling available',
        description: 'Your GPU supports hardware-accelerated scheduling for better frame pacing.',
        category: 'nvidia',
        severity: 'medium',
        gamingImpact: 'Better frame pacing, reduced micro-stutter',
        requiredTier: LicenseTier.PREMIUM,
        tweakId: 'nv-hardware-scheduling',
      })
    }
  }
}

function analyzeDebloat(info: SystemInfo, tier: LicenseTier, issues: ScanIssue[]) {
  if (info.startup.count > 8) {
    issues.push({
      id: 'debloat-startup-high',
      title: `${info.startup.count} startup programs detected`,
      description: `Programs: ${info.startup.programs.slice(0, 5).join(', ')}${info.startup.count > 5 ? '...' : ''}`,
      category: 'debloat',
      severity: info.startup.count > 15 ? 'high' : 'medium',
      gamingImpact: 'Faster boot, more available RAM',
      requiredTier: LicenseTier.FREE,
      tweakId: 'debloat-disable-startup',
    })
  }

  if (info.processes.background > 80) {
    issues.push({
      id: 'debloat-background-high',
      title: `${info.processes.background} background processes running`,
      description: 'High background process count consumes CPU and RAM resources.',
      category: 'debloat',
      severity: info.processes.background > 120 ? 'high' : 'medium',
      gamingImpact: 'More CPU/RAM available for games',
      requiredTier: LicenseTier.FREE,
      tweakId: 'debloat-remove-background',
    })
  }

  issues.push({
    id: 'debloat-superfetch',
    title: 'Superfetch/SysMain may be consuming resources',
    description: 'Windows prefetching service can use disk and RAM during gaming.',
    category: 'debloat',
    severity: 'low',
    gamingImpact: 'Reduced disk usage during gaming',
    requiredTier: LicenseTier.FREE,
    tweakId: 'debloat-superfetch',
  })

  if (tier === LicenseTier.PRO || tier === LicenseTier.PREMIUM) {
    issues.push({
      id: 'debloat-telemetry',
      title: 'Telemetry services running in background',
      description: 'Windows telemetry data collection uses CPU and network resources.',
      category: 'debloat',
      severity: 'medium',
      gamingImpact: 'Reduced background CPU usage',
      requiredTier: LicenseTier.PRO,
      tweakId: 'debloat-disable-telemetry',
    })
  }
}

function analyzeMouse(info: SystemInfo, tier: LicenseTier, issues: ScanIssue[]) {
  if (info.mouse.enhancePointerPrecision) {
    issues.push({
      id: 'mouse-acceleration',
      title: 'Mouse acceleration is enabled',
      description: 'Enhance Pointer Precision is active. This causes inconsistent aim in games.',
      category: 'mouse',
      severity: 'high',
      gamingImpact: 'Better aim stability, consistent aim',
      requiredTier: LicenseTier.FREE,
      tweakId: 'mouse-disable-acceleration',
    })
  }

  issues.push({
    id: 'mouse-raw-input',
    title: 'Raw input mode recommended',
    description: 'Forcing raw mouse input bypasses Windows processing for direct response.',
    category: 'mouse',
    severity: 'medium',
    gamingImpact: 'Direct mouse-to-game response',
    requiredTier: LicenseTier.FREE,
    tweakId: 'mouse-raw-input',
  })

  if (tier === LicenseTier.PRO || tier === LicenseTier.PREMIUM) {
    issues.push({
      id: 'mouse-optimize',
      title: 'Mouse pointer settings can be optimized',
      description: 'Windows pointer speed and acceleration settings affect gaming aim.',
      category: 'mouse',
      severity: 'medium',
      gamingImpact: 'Consistent sensitivity across games',
      requiredTier: LicenseTier.PRO,
      tweakId: 'mouse-optimize-pointer',
    })
  }
}

function analyzeKeyboard(info: SystemInfo, tier: LicenseTier, issues: ScanIssue[]) {
  if (info.keyboard.filterKeys) {
    issues.push({
      id: 'kb-filter-keys',
      title: 'Filter Keys is enabled',
      description: 'Filter Keys ignores brief or repeated keystrokes, causing missed inputs.',
      category: 'keyboard',
      severity: 'high',
      gamingImpact: 'Faster key response, no missed inputs',
      requiredTier: LicenseTier.FREE,
      tweakId: 'kb-disable-filter-keys',
    })
  }

  if (info.keyboard.stickyKeys) {
    issues.push({
      id: 'kb-sticky-keys',
      title: 'Sticky Keys is enabled',
      description: 'Sticky Keys can intercept key combinations during gameplay.',
      category: 'keyboard',
      severity: 'medium',
      gamingImpact: 'Uninterrupted gameplay',
      requiredTier: LicenseTier.FREE,
      tweakId: 'kb-disable-sticky-keys',
    })
  }

  if (tier === LicenseTier.PRO || tier === LicenseTier.PREMIUM) {
    issues.push({
      id: 'kb-repeat',
      title: 'Key repeat settings not optimized',
      description: 'Default repeat delay may be too slow for fast input scenarios.',
      category: 'keyboard',
      severity: 'low',
      gamingImpact: 'Faster repeated inputs',
      requiredTier: LicenseTier.PRO,
      tweakId: 'kb-optimize-repeat',
    })
  }
}

function analyzeSystem(info: SystemInfo, tier: LicenseTier, issues: ScanIssue[]) {
  if (info.powerPlan !== 'High performance' && info.powerPlan !== 'Ultimate Performance') {
    issues.push({
      id: 'sys-power-plan',
      title: `Power plan: "${info.powerPlan}"`,
      description: 'Current power plan is not optimized for gaming performance.',
      category: 'system',
      severity: 'high',
      gamingImpact: 'Maximum CPU performance',
      requiredTier: LicenseTier.FREE,
      tweakId: 'sys-high-performance',
    })
  }

  if (info.gameMode === false) {
    issues.push({
      id: 'sys-game-mode',
      title: 'Game Mode is disabled',
      description: 'Windows Game Mode can reduce background interference during gaming.',
      category: 'system',
      severity: 'medium',
      gamingImpact: 'Reduced background interference',
      requiredTier: LicenseTier.FREE,
      tweakId: 'sys-enable-game-mode',
    })
  }

  const ramPercent = info.ram.total > 0 ? (info.ram.used / info.ram.total) * 100 : 0
  if (ramPercent > 85) {
    issues.push({
      id: 'sys-ram-high',
      title: `RAM usage critical: ${ramPercent.toFixed(0)}%`,
      description: `${(info.ram.used / 1024).toFixed(1)} GB of ${(info.ram.total / 1024).toFixed(1)} GB used.`,
      category: 'system',
      severity: 'high',
      gamingImpact: 'More resources for games',
      requiredTier: LicenseTier.FREE,
      tweakId: 'debloat-remove-background',
    })
  }

  if (info.disk.total > 0) {
    const diskPercent = (info.disk.used / info.disk.total) * 100
    if (diskPercent > 90) {
      issues.push({
        id: 'sys-disk-full',
        title: `Disk space critical: ${diskPercent.toFixed(0)}% used`,
        description: 'Low disk space can cause performance issues and prevent game installations.',
        category: 'system',
        severity: 'high',
        gamingImpact: 'More storage for game installations',
        requiredTier: LicenseTier.FREE,
        tweakId: 'sys-disk-cleanup',
      })
    }
  }
}

function calculateScore(issues: ScanIssue[]): number {
  let score = 100
  for (const issue of issues) {
    if (issue.severity === 'high') score -= 12
    else if (issue.severity === 'medium') score -= 6
    else score -= 2
  }
  return Math.max(0, Math.min(100, score))
}

function getSystemClass(score: number, issues: ScanIssue[]): 'LOW' | 'MID' | 'HIGH' | 'STUTTER RISK' {
  const hasHighSev = issues.some(i => i.severity === 'high')
  if (score >= 80 && !hasHighSev) return 'HIGH'
  if (score >= 50) return 'MID'
  if (hasHighSev && score < 40) return 'STUTTER RISK'
  return 'LOW'
}
