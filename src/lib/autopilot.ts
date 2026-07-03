import { GameProfile, LicenseTier } from '@/types'
import { gameProfiles } from '@/data/games'

type OptTier = 'free' | 'pro' | 'premium'

function getTweaksForTier(game: GameProfile, tier: OptTier): string[] {
  switch (tier) {
    case 'free': return game.tweakTiers.free
    case 'pro': return [...game.tweakTiers.free, ...game.tweakTiers.pro]
    case 'premium': return [...game.tweakTiers.free, ...game.tweakTiers.pro, ...game.tweakTiers.premium]
  }
}

function tierRank(t: LicenseTier): number {
  switch (t) {
    case LicenseTier.FREE: return 1
    case LicenseTier.PRO: return 2
    case LicenseTier.PREMIUM: return 3
    default: return 0
  }
}

function tierLicenseRequired(optTier: OptTier): LicenseTier {
  switch (optTier) {
    case 'free': return LicenseTier.FREE
    case 'pro': return LicenseTier.PRO
    case 'premium': return LicenseTier.PREMIUM
  }
}

export async function detectRunningGames(selectedGames: GameProfile[]): Promise<{ profile: GameProfile; pid: number }[]> {
  if (selectedGames.length === 0) return []
  try {
    const executables = selectedGames.map(g => g.executable)
    const result = await window.electronAPI?.detectGames(executables)
    if (!result?.running) return []
    return result.running
      .map(proc => {
        const profile = selectedGames.find(g =>
          g.executable.replace(/\.(exe)$/i, '').toLowerCase() === proc.name.toLowerCase()
        )
        return profile ? { profile, pid: proc.pid } : null
      })
      .filter((r): r is { profile: GameProfile; pid: number } => r !== null)
  } catch {
    return []
  }
}

export async function optimizeGameTier(game: GameProfile, optTier: OptTier, userTier: LicenseTier): Promise<{ success: boolean; applied: number }> {
  if (tierRank(userTier) < tierRank(tierLicenseRequired(optTier))) {
    return { success: false, applied: 0 }
  }
  const tweakList = getTweaksForTier(game, optTier)
  try {
    const result = await window.electronAPI?.applyGameTweaks(tweakList)
    return result || { success: false, applied: 0 }
  } catch {
    return { success: false, applied: 0 }
  }
}

export async function restoreGame(game: GameProfile): Promise<{ success: boolean; restored: number }> {
  const allTweaks = [...game.tweakTiers.free, ...game.tweakTiers.pro, ...game.tweakTiers.premium]
  try {
    const result = await window.electronAPI?.restoreGameTweaks(allTweaks)
    return result || { success: false, restored: 0 }
  } catch {
    return { success: false, restored: 0 }
  }
}

export function getMaxTweakCount(game: GameProfile): number {
  return game.tweakTiers.free.length + game.tweakTiers.pro.length + game.tweakTiers.premium.length
}

export function getTweakCountForTier(game: GameProfile, tier: OptTier): number {
  return getTweaksForTier(game, tier).length
}

export function getGameProfiles(): GameProfile[] {
  return gameProfiles
}

export function canAddGame(currentCount: number, userTier: LicenseTier): boolean {
  switch (userTier) {
    case LicenseTier.FREE: return currentCount < 1
    case LicenseTier.PRO: return true
    case LicenseTier.PREMIUM: return true
    default: return false
  }
}
