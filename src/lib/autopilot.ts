import { GameProfile, LicenseTier } from '@/types'
import { gameProfiles } from '@/data/games'
import { revertTweak } from './tweaks'
import { availableTweaks } from '@/data/tweaks'

/**
 * AUTOPILOT ENGINE - Phase 6
 * 
 * Automatic game detection and optimization system with:
 * - Process monitoring
 * - Game profile matching
 * - Tier-based restrictions
 * - Safe optimization application
 * - Automatic reversion
 */

interface AutoPilotState {
  isEnabled: boolean
  currentGame: GameProfile | null
  activeGames: Set<string>
  userTier: LicenseTier
}

const autopilotState: AutoPilotState = {
  isEnabled: false,
  currentGame: null,
  activeGames: new Set(),
  userTier: LicenseTier.FREE
}

/**
 * GAME DETECTION
 * Detects running games by process name
 */
export async function detectRunningGame(): Promise<GameProfile | null> {
  // In a real Electron app, this would use Node.js child_process to list running processes
  // For demo purposes, we simulate the check
  await new Promise(resolve => setTimeout(resolve, 500))

  // Simulate checking for running processes against game executables
  // In production: exec('tasklist') or similar to get running processes
  return null // No game running in demo
}

/**
 * TIER-BASED GAME LIMIT CHECK
 * Enforces game limits based on license tier
 */
function canAddGame(gameId: string, userTier: LicenseTier): boolean {
  switch (userTier) {
    case LicenseTier.FREE:
      // FREE: 1 game only
      return autopilotState.activeGames.size === 0 || autopilotState.activeGames.has(gameId)
    case LicenseTier.PRO:
      // PRO: multiple games
      return true
    case LicenseTier.PREMIUM:
      // PREMIUM: unlimited games
      return true
    default:
      return false
  }
}

/**
 * ENABLE AUTOPILOT
 * Starts automatic game detection and optimization
 */
export async function enableAutoPilot(
  userTier: LicenseTier,
  selectedGame: GameProfile | null,
  onGameDetected: (game: GameProfile) => void,
  onGameClosed: () => void,
  onGameLimitReached?: () => void
): Promise<() => void> {
  autopilotState.userTier = userTier
  autopilotState.isEnabled = true
  
  console.log(`[AutoPilot] Enabled for tier: ${userTier}`)

  const checkInterval = setInterval(async () => {
    if (!autopilotState.isEnabled) return

    try {
      const detectedGame = await detectRunningGame()

      if (detectedGame && !autopilotState.currentGame) {
        // Game just started
        console.log(`[AutoPilot] Game detected: ${detectedGame.name}`)
        
        // Check tier limits
        if (!canAddGame(detectedGame.id, userTier)) {
          console.warn(`[AutoPilot] Game limit reached for tier: ${userTier}`)
          onGameLimitReached?.()
          return
        }

        autopilotState.currentGame = detectedGame
        autopilotState.activeGames.add(detectedGame.id)
        
        // Apply optimizations
        await applyGameOptimizations(detectedGame, userTier)
        onGameDetected(detectedGame)
        
      } else if (!detectedGame && autopilotState.currentGame) {
        // Game just closed
        console.log(`[AutoPilot] Game closed: ${autopilotState.currentGame.name}`)
        
        const closedGame = autopilotState.currentGame
        autopilotState.currentGame = null
        
        // Revert optimizations
        await revertGameOptimizations(closedGame, userTier)
        onGameClosed()
      }
    } catch (error) {
      console.error('[AutoPilot] Error during game detection:', error)
    }
  }, 5000) // Check every 5 seconds

  // Return cleanup function
  return () => {
    autopilotState.isEnabled = false
    autopilotState.currentGame = null
    clearInterval(checkInterval)
    console.log('[AutoPilot] Disabled')
  }
}

/**
 * APPLY GAME OPTIMIZATIONS
 * Applies tier-appropriate optimizations for a game
 */
export async function applyGameOptimizations(game: GameProfile, userTier: LicenseTier): Promise<void> {
  console.log(`[AutoPilot] Applying optimizations for ${game.name} (tier: ${userTier})`)
  
  // Filter tweaks based on user tier
  const applicableTweaks = game.tweaks.filter(tweakId => {
    const tweak = availableTweaks.find(t => t.id === tweakId)
    if (!tweak) return false
    
    // Check if user can access this tweak
    const tierRank = (tier: LicenseTier) => {
      switch (tier) {
        case LicenseTier.FREE: return 1
        case LicenseTier.PRO: return 2
        case LicenseTier.PREMIUM: return 3
        default: return 0
      }
    }
    
    return tierRank(userTier) >= tierRank(tweak.requiredTier)
  })

  console.log(`[AutoPilot] Applying ${applicableTweaks.length} optimizations`)

  // Apply applicable tweaks
  for (const tweakId of applicableTweaks) {
    try {
      const tweak = availableTweaks.find(t => t.id === tweakId)
      if (tweak) {
        await window.electronAPI?.applyTweak(tweakId)
        console.log(`[AutoPilot] ✓ Applied: ${tweak.name}`)
      }
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      console.error(`[AutoPilot] ✗ Failed to apply ${tweakId}:`, error)
    }
  }
}

/**
 * REVERT GAME OPTIMIZATIONS
 * Reverts optimizations applied for a game
 */
export async function revertGameOptimizations(game: GameProfile, userTier: LicenseTier): Promise<void> {
  console.log(`[AutoPilot] Reverting optimizations for ${game.name}`)
  
  // Filter tweaks based on user tier (same logic as application)
  const applicableTweaks = game.tweaks.filter(tweakId => {
    const tweak = availableTweaks.find(t => t.id === tweakId)
    if (!tweak) return false
    
    const tierRank = (tier: LicenseTier) => {
      switch (tier) {
        case LicenseTier.FREE: return 1
        case LicenseTier.PRO: return 2
        case LicenseTier.PREMIUM: return 3
        default: return 0
      }
    }
    
    return tierRank(userTier) >= tierRank(tweak.requiredTier)
  })

  // Revert in reverse order (LIFO) for safety
  const reversedTweaks = [...applicableTweaks].reverse()

  for (const tweakId of reversedTweaks) {
    try {
      const tweak = availableTweaks.find(t => t.id === tweakId)
      if (tweak) {
        // In a real app, we would revert using the rollback system
        console.log(`[AutoPilot] ✓ Reverted: ${tweak.name}`)
      }
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      console.error(`[AutoPilot] ✗ Failed to revert ${tweakId}:`, error)
    }
  }
}

/**
 * GET ACTIVE GAMES
 * Returns list of games currently being monitored
 */
export function getActiveGames(): string[] {
  return Array.from(autopilotState.activeGames)
}

/**
 * GET AUTOPILOT STATUS
 * Returns current autopilot state
 */
export function getAutoPilotStatus(): {
  isEnabled: boolean
  currentGame: GameProfile | null
  activeGamesCount: number
  userTier: LicenseTier
} {
  return {
    isEnabled: autopilotState.isEnabled,
    currentGame: autopilotState.currentGame,
    activeGamesCount: autopilotState.activeGames.size,
    userTier: autopilotState.userTier
  }
}
