import { LicenseTier, Feature, TweakCategory } from '@/types'

export function canAccess(featureId: string, userTier: LicenseTier): boolean {
  const feature = featureRegistry.find(f => f.id === featureId)
  if (!feature) return getTierRank(userTier) >= 1
  return getTierRank(userTier) >= getTierRank(feature.tier)
}

export function canAccessTier(userTier: LicenseTier, requiredTier: LicenseTier): boolean {
  return getTierRank(userTier) >= getTierRank(requiredTier)
}

export function getTweakFeatureKey(category: TweakCategory): string {
  return `tweak_${category}`
}

function getTierRank(tier: LicenseTier): number {
  switch (tier) {
    case LicenseTier.FREE: return 1
    case LicenseTier.PRO: return 2
    case LicenseTier.PREMIUM: return 3
    default: return 0
  }
}

export const featureRegistry: Feature[] = [
  { id: 'tweak_basic', name: 'Basic Tweaks', description: 'Essential gaming optimizations', tier: LicenseTier.FREE, gamingImpact: 'Improves FPS and reduces latency', category: 'tweak' },
  { id: 'tweak_network', name: 'Network Tweaks', description: 'Network latency optimization', tier: LicenseTier.PRO, gamingImpact: 'Lower ping and stable connection', category: 'tweak' },
  { id: 'tweak_nvidia', name: 'NVIDIA Tweaks', description: 'GPU optimization for NVIDIA cards', tier: LicenseTier.PRO, gamingImpact: 'FPS stability and input lag reduction', category: 'tweak' },
  { id: 'tweak_nv_low_latency', name: 'NVIDIA Low Latency', description: 'Ultra low latency mode', tier: LicenseTier.PRO, gamingImpact: 'Reduced input lag', category: 'tweak' },
  { id: 'tweak_mouse', name: 'Mouse Optimization', description: 'Raw input and acceleration fixes', tier: LicenseTier.PRO, gamingImpact: 'Better aim stability', category: 'tweak' },
  { id: 'tweak_advanced', name: 'Advanced Tweaks', description: 'Premium system optimizations', tier: LicenseTier.PREMIUM, gamingImpact: 'Maximum performance gains', category: 'tweak' },
  { id: 'scan_basic', name: 'Basic Scan', description: 'Quick system analysis', tier: LicenseTier.FREE, gamingImpact: 'Identifies performance bottlenecks', category: 'scan' },
  { id: 'scan_advanced', name: 'Advanced Scan', description: 'Deep system analysis', tier: LicenseTier.PRO, gamingImpact: 'Detailed bottleneck detection', category: 'scan' },
  { id: 'autopilot_basic', name: 'Basic AutoPilot', description: 'Single game optimization', tier: LicenseTier.FREE, gamingImpact: 'Auto-optimizes on game launch', category: 'autopilot' },
  { id: 'autopilot_multi', name: 'Multi-Game AutoPilot', description: 'Multiple game profiles', tier: LicenseTier.PRO, gamingImpact: 'All games optimized automatically', category: 'autopilot' },
  { id: 'undo_basic', name: 'Basic Rollback', description: 'Revert individual tweaks', tier: LicenseTier.FREE, gamingImpact: 'Safe experimentation', category: 'undo' },
  { id: 'undo_full', name: 'Full Restore', description: 'Complete system restore', tier: LicenseTier.PREMIUM, gamingImpact: 'Restore any previous state', category: 'undo' },
  { id: 'optimizer_processes', name: 'Process Optimizer', description: 'Reduce background processes', tier: LicenseTier.PRO, gamingImpact: 'More resources for games', category: 'tweak' },
]
