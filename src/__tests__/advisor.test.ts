import { strict as assert } from 'node:assert'
import { generateRecommendations, calculateHealthScore, classifySystem } from '../lib/advisor'
import { SystemInfo, LicenseTier, AdvisorIssue } from '../types'

// ─── Test Helpers ───

function makeSystemInfo(overrides: Partial<SystemInfo> = {}): SystemInfo {
  return {
    cpu: { model: 'Test CPU', cores: 8, threads: 16, usage: 30, maxClockMhz: 4500 },
    gpu: { model: 'Test GPU', vram: 8192, usage: 50, vendor: 'nvidia' },
    ram: { total: 16384, used: 8192, available: 8192 },
    disk: { total: 512000, used: 256000, available: 256000, drives: [] },
    os: { version: 'Windows 11', build: '22621', architecture: '64-bit' },
    uptime: 3600,
    powerPlan: 'Balanced',
    gameMode: false,
    network: { latencyMs: 50, adapterName: 'Ethernet' },
    startup: { count: 5, programs: [] },
    processes: { total: 100, background: 40 },
    mouse: { name: 'Test Mouse', enhancePointerPrecision: false, pollingRateDetected: false },
    ...overrides,
  }
}

// ─── generateRecommendations tests ───

console.log('Testing: generateRecommendations')

// Test: Balanced power plan generates issue
{
  const info = makeSystemInfo({ powerPlan: 'Balanced' })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const powerIssue = issues.find(i => i.id === 'advisor-power-plan')
  assert.ok(powerIssue, 'Should generate power plan issue for Balanced')
  assert.equal(powerIssue!.severity, 'high')
  assert.equal(powerIssue!.tweakId, 'sys-high-performance')
  assert.equal(powerIssue!.undoable, true)
  console.log('  PASS: Balanced power plan detected')
}

// Test: High performance power plan does NOT generate issue
{
  const info = makeSystemInfo({ powerPlan: 'High performance' })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const powerIssue = issues.find(i => i.id === 'advisor-power-plan')
  assert.equal(powerIssue, undefined, 'Should NOT generate power plan issue for High performance')
  console.log('  PASS: High performance power plan - no issue')
}

// Test: Ultimate Performance power plan does NOT generate issue
{
  const info = makeSystemInfo({ powerPlan: 'Ultimate Performance' })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const powerIssue = issues.find(i => i.id === 'advisor-power-plan')
  assert.equal(powerIssue, undefined, 'Should NOT generate power plan issue for Ultimate Performance')
  console.log('  PASS: Ultimate Performance power plan - no issue')
}

// Test: Game Mode disabled generates issue
{
  const info = makeSystemInfo({ gameMode: false })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const gmIssue = issues.find(i => i.id === 'advisor-game-mode')
  assert.ok(gmIssue, 'Should generate game mode issue when disabled')
  assert.equal(gmIssue!.severity, 'medium')
  console.log('  PASS: Game Mode disabled detected')
}

// Test: Game Mode enabled does NOT generate issue
{
  const info = makeSystemInfo({ gameMode: true })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const gmIssue = issues.find(i => i.id === 'advisor-game-mode')
  assert.equal(gmIssue, undefined, 'Should NOT generate game mode issue when enabled')
  console.log('  PASS: Game Mode enabled - no issue')
}

// Test: High disk usage generates issue
{
  const info = makeSystemInfo({
    disk: { total: 1000, used: 900, available: 100, drives: [] }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const diskIssue = issues.find(i => i.id === 'advisor-disk-space')
  assert.ok(diskIssue, 'Should generate disk space issue at 90% usage')
  assert.equal(diskIssue!.severity, 'medium')
  console.log('  PASS: Disk 90% full detected')
}

// Test: Critical disk usage generates high severity
{
  const info = makeSystemInfo({
    disk: { total: 1000, used: 950, available: 50, drives: [] }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const diskIssue = issues.find(i => i.id === 'advisor-disk-space')
  assert.ok(diskIssue, 'Should generate disk space issue at 95% usage')
  assert.equal(diskIssue!.severity, 'high')
  console.log('  PASS: Disk 95% full = high severity')
}

// Test: Low disk usage does NOT generate issue
{
  const info = makeSystemInfo({
    disk: { total: 1000, used: 500, available: 500, drives: [] }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const diskIssue = issues.find(i => i.id === 'advisor-disk-space')
  assert.equal(diskIssue, undefined, 'Should NOT generate disk issue at 50% usage')
  console.log('  PASS: Disk 50% - no issue')
}

// Test: High RAM usage generates issue
{
  const info = makeSystemInfo({
    ram: { total: 16384, used: 14745, available: 1639 }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const ramIssue = issues.find(i => i.id === 'advisor-ram-high')
  assert.ok(ramIssue, 'Should generate RAM issue at 90% usage')
  assert.equal(ramIssue!.severity, 'medium')
  console.log('  PASS: RAM 90% usage detected')
}

// Test: Critical RAM usage generates high severity
{
  const info = makeSystemInfo({
    ram: { total: 16384, used: 15564, available: 820 }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const ramIssue = issues.find(i => i.id === 'advisor-ram-high')
  assert.ok(ramIssue, 'Should generate RAM issue at 95% usage')
  assert.equal(ramIssue!.severity, 'high')
  console.log('  PASS: RAM 95% usage = high severity')
}

// Test: Low RAM usage does NOT generate issue
{
  const info = makeSystemInfo({
    ram: { total: 16384, used: 8192, available: 8192 }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const ramIssue = issues.find(i => i.id === 'advisor-ram-high')
  assert.equal(ramIssue, undefined, 'Should NOT generate RAM issue at 50% usage')
  console.log('  PASS: RAM 50% - no issue')
}

// Test: Many startup programs generate issue
{
  const info = makeSystemInfo({
    startup: { count: 12, programs: ['App1', 'App2', 'App3'] }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const startupIssue = issues.find(i => i.id === 'advisor-startup-count')
  assert.ok(startupIssue, 'Should generate startup issue with 12 programs')
  assert.equal(startupIssue!.severity, 'medium')
  console.log('  PASS: 12 startup programs detected')
}

// Test: Many startup programs generate high severity
{
  const info = makeSystemInfo({
    startup: { count: 20, programs: ['App1', 'App2', 'App3'] }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const startupIssue = issues.find(i => i.id === 'advisor-startup-count')
  assert.ok(startupIssue, 'Should generate startup issue with 20 programs')
  assert.equal(startupIssue!.severity, 'high')
  console.log('  PASS: 20 startup programs = high severity')
}

// Test: Few startup programs do NOT generate issue
{
  const info = makeSystemInfo({
    startup: { count: 5, programs: ['App1'] }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const startupIssue = issues.find(i => i.id === 'advisor-startup-count')
  assert.equal(startupIssue, undefined, 'Should NOT generate startup issue with 5 programs')
  console.log('  PASS: 5 startup programs - no issue')
}

// Test: High background processes generate issue
{
  const info = makeSystemInfo({
    processes: { total: 200, background: 100 }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const bgIssue = issues.find(i => i.id === 'advisor-background-procs')
  assert.ok(bgIssue, 'Should generate background process issue at 100')
  assert.equal(bgIssue!.severity, 'medium')
  console.log('  PASS: 100 background processes detected')
}

// Test: Critical background processes generate high severity
{
  const info = makeSystemInfo({
    processes: { total: 250, background: 150 }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const bgIssue = issues.find(i => i.id === 'advisor-background-procs')
  assert.ok(bgIssue, 'Should generate background process issue at 150')
  assert.equal(bgIssue!.severity, 'high')
  console.log('  PASS: 150 background processes = high severity')
}

// Test: Low background processes do NOT generate issue
{
  const info = makeSystemInfo({
    processes: { total: 80, background: 30 }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const bgIssue = issues.find(i => i.id === 'advisor-background-procs')
  assert.equal(bgIssue, undefined, 'Should NOT generate background process issue at 30')
  console.log('  PASS: 30 background processes - no issue')
}

// Test: Mouse acceleration detected
{
  const info = makeSystemInfo({
    mouse: { name: 'Gaming Mouse', enhancePointerPrecision: true, pollingRateDetected: false }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const mouseIssue = issues.find(i => i.id === 'advisor-mouse-accel')
  assert.ok(mouseIssue, 'Should detect mouse acceleration')
  assert.equal(mouseIssue!.severity, 'high')
  console.log('  PASS: Mouse acceleration detected')
}

// Test: Mouse acceleration OFF does NOT generate issue
{
  const info = makeSystemInfo({
    mouse: { name: 'Gaming Mouse', enhancePointerPrecision: false, pollingRateDetected: false }
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const mouseIssue = issues.find(i => i.id === 'advisor-mouse-accel')
  assert.equal(mouseIssue, undefined, 'Should NOT detect mouse acceleration when OFF')
  console.log('  PASS: Mouse acceleration OFF - no issue')
}

// Test: NVIDIA low latency issue only for PRO+ tier
{
  const infoFree = makeSystemInfo({
    gpu: { model: 'RTX 4070', vram: 12288, usage: 60, vendor: 'nvidia' }
  })
  const issuesFree = generateRecommendations(infoFree, LicenseTier.FREE)
  const lowLatFree = issuesFree.find(i => i.id === 'advisor-nv-low-latency')
  assert.equal(lowLatFree, undefined, 'Should NOT show low latency issue for FREE tier')

  const infoPro = makeSystemInfo({
    gpu: { model: 'RTX 4070', vram: 12288, usage: 60, vendor: 'nvidia' }
  })
  const issuesPro = generateRecommendations(infoPro, LicenseTier.PRO)
  const lowLatPro = issuesPro.find(i => i.id === 'advisor-nv-low-latency')
  assert.ok(lowLatPro, 'Should show low latency issue for PRO tier')
  console.log('  PASS: NVIDIA low latency - tier gated')
}

// Test: High latency generates issue
{
  const info = makeSystemInfo({
    network: { latencyMs: 120, adapterName: 'Wi-Fi' }
  })
  const issues = generateRecommendations(info, LicenseTier.PRO)
  const latIssue = issues.find(i => i.id === 'advisor-high-latency')
  assert.ok(latIssue, 'Should detect high latency')
  assert.equal(latIssue!.severity, 'medium')
  console.log('  PASS: High latency detected')
}

// Test: Normal latency does NOT generate issue
{
  const info = makeSystemInfo({
    network: { latencyMs: 30, adapterName: 'Ethernet' }
  })
  const issues = generateRecommendations(info, LicenseTier.PRO)
  const latIssue = issues.find(i => i.id === 'advisor-high-latency')
  assert.equal(latIssue, undefined, 'Should NOT generate latency issue at 30ms')
  console.log('  PASS: Normal latency - no issue')
}

// Test: PRO tier gets network throttle issue
{
  const info = makeSystemInfo()
  const issues = generateRecommendations(info, LicenseTier.PRO)
  const throttleIssue = issues.find(i => i.id === 'advisor-network-throttle')
  assert.ok(throttleIssue, 'PRO tier should get network throttle issue')
  console.log('  PASS: Network throttle - PRO tier')
}

// Test: FREE tier does NOT get network throttle issue
{
  const info = makeSystemInfo()
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const throttleIssue = issues.find(i => i.id === 'advisor-network-throttle')
  assert.equal(throttleIssue, undefined, 'FREE tier should NOT get network throttle issue')
  console.log('  PASS: Network throttle - FREE tier excluded')
}

// Test: PRO tier gets telemetry issue
{
  const info = makeSystemInfo()
  const issues = generateRecommendations(info, LicenseTier.PRO)
  const telIssue = issues.find(i => i.id === 'advisor-telemetry')
  assert.ok(telIssue, 'PRO tier should get telemetry issue')
  console.log('  PASS: Telemetry - PRO tier')
}

// Test: FREE tier does NOT get telemetry issue
{
  const info = makeSystemInfo()
  const issues = generateRecommendations(info, LicenseTier.FREE)
  const telIssue = issues.find(i => i.id === 'advisor-telemetry')
  assert.equal(telIssue, undefined, 'FREE tier should NOT get telemetry issue')
  console.log('  PASS: Telemetry - FREE tier excluded')
}

// Test: Clean system generates no issues
{
  const info = makeSystemInfo({
    powerPlan: 'High performance',
    gameMode: true,
    disk: { total: 1000, used: 300, available: 700, drives: [] },
    ram: { total: 32768, used: 8192, available: 24576 },
    startup: { count: 3, programs: [] },
    processes: { total: 60, background: 20 },
    mouse: { name: 'Mouse', enhancePointerPrecision: false, pollingRateDetected: false },
    gpu: { model: 'Intel UHD', vram: 0, usage: 0, vendor: 'intel' },
    network: { latencyMs: 20, adapterName: 'Ethernet' },
  })
  const issues = generateRecommendations(info, LicenseTier.FREE)
  assert.equal(issues.length, 0, 'Clean system should have zero issues')
  console.log('  PASS: Clean system = zero issues')
}

// ─── calculateHealthScore tests ───

console.log('\nTesting: calculateHealthScore')

{
  const score = calculateHealthScore([])
  assert.equal(score, 100, 'No issues = score 100')
  console.log('  PASS: No issues = 100')
}

{
  const issues: AdvisorIssue[] = [
    { id: '1', title: '', description: '', gamingImpact: '', severity: 'high', category: 'system', tweakId: '', requiredTier: LicenseTier.FREE, undoable: true },
  ]
  const score = calculateHealthScore(issues)
  assert.equal(score, 88, 'One high issue = 100 - 12 = 88')
  console.log('  PASS: One high issue = 88')
}

{
  const issues: AdvisorIssue[] = [
    { id: '1', title: '', description: '', gamingImpact: '', severity: 'medium', category: 'system', tweakId: '', requiredTier: LicenseTier.FREE, undoable: true },
  ]
  const score = calculateHealthScore(issues)
  assert.equal(score, 94, 'One medium issue = 100 - 6 = 94')
  console.log('  PASS: One medium issue = 94')
}

{
  const issues: AdvisorIssue[] = [
    { id: '1', title: '', description: '', gamingImpact: '', severity: 'low', category: 'system', tweakId: '', requiredTier: LicenseTier.FREE, undoable: true },
  ]
  const score = calculateHealthScore(issues)
  assert.equal(score, 98, 'One low issue = 100 - 2 = 98')
  console.log('  PASS: One low issue = 98')
}

{
  const issues: AdvisorIssue[] = Array.from({ length: 10 }, (_, i) => ({
    id: String(i), title: '', description: '', gamingImpact: '',
    severity: 'high' as const, category: 'system' as const,
    tweakId: '', requiredTier: LicenseTier.FREE, undoable: true,
  }))
  const score = calculateHealthScore(issues)
  assert.equal(score, 0, '10 high issues = max(0, 100 - 120) = 0')
  console.log('  PASS: 10 high issues = 0 (floor)')
}

// ─── classifySystem tests ───

console.log('\nTesting: classifySystem')

{
  const info = makeSystemInfo()
  const cls = classifySystem(info, 85, [])
  assert.equal(cls, 'HIGH', 'Score 80+ with no high severity = HIGH')
  console.log('  PASS: Score 85 = HIGH')
}

{
  const info = makeSystemInfo()
  const cls = classifySystem(info, 60, [])
  assert.equal(cls, 'MID', 'Score 50-79 = MID')
  console.log('  PASS: Score 60 = MID')
}

{
  const info = makeSystemInfo()
  const highIssues: AdvisorIssue[] = [
    { id: '1', title: '', description: '', gamingImpact: '', severity: 'high', category: 'system', tweakId: '', requiredTier: LicenseTier.FREE, undoable: true },
  ]
  const cls = classifySystem(info, 30, highIssues)
  assert.equal(cls, 'STUTTER RISK', 'Score <40 with high severity = STUTTER RISK')
  console.log('  PASS: Score 30 + high sev = STUTTER RISK')
}

{
  const info = makeSystemInfo()
  const cls = classifySystem(info, 20, [])
  assert.equal(cls, 'LOW', 'Score <50 without high severity = LOW')
  console.log('  PASS: Score 20 = LOW')
}

{
  const info = makeSystemInfo()
  const cls = classifySystem(info, 80, [])
  assert.equal(cls, 'HIGH', 'Score exactly 80 with no high sev = HIGH')
  console.log('  PASS: Score exactly 80 = HIGH')
}

{
  const info = makeSystemInfo()
  const highIssues: AdvisorIssue[] = [
    { id: '1', title: '', description: '', gamingImpact: '', severity: 'high', category: 'system', tweakId: '', requiredTier: LicenseTier.FREE, undoable: true },
  ]
  const cls = classifySystem(info, 80, highIssues)
  assert.equal(cls, 'MID', 'Score 80 with high severity = MID (not HIGH)')
  console.log('  PASS: Score 80 + high sev = MID')
}

console.log('\nAll tests passed.')
