import { Tweak, RollbackEntry, TweakCategory } from '@/types'

interface TweakLog {
  id: string
  tweakId: string
  action: 'apply' | 'revert'
  timestamp: Date
  success: boolean
  error?: string
}

const tweakLog: TweakLog[] = []

function logTweakAction(action: 'apply' | 'revert', tweakId: string, success: boolean, error?: string) {
  tweakLog.push({
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tweakId, action, timestamp: new Date(), success, error
  })
}

export function getTweakLog() { return [...tweakLog] }

export function createRollbackEntry(tweakId: string): RollbackEntry {
  return {
    id: `rollback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tweakId,
    timestamp: new Date(),
    originalValue: ORIGINAL_VALUES[tweakId] ?? 'previous',
    currentValue: NEW_VALUES[tweakId] ?? 'applied',
    reverted: false,
  }
}

export async function revertTweak(entry: RollbackEntry): Promise<boolean> {
  try {
    const result = await window.electronAPI?.restoreTweak(entry.tweakId)
    if (result?.success) {
      logTweakAction('revert', entry.tweakId, true)
      return true
    }
    logTweakAction('revert', entry.tweakId, false, result?.error || 'Restore failed')
    return false
  } catch (error) {
    logTweakAction('revert', entry.tweakId, false, error instanceof Error ? error.message : 'Unknown')
    return false
  }
}

const ORIGINAL_VALUES: Record<string, any> = {
  'net-disable-background-updates': 'enabled',
  'net-optimize-dns': 'ISP default',
  'net-reduce-congestion': 'default',
  'net-disable-throttling': 'enabled',
  'net-reset-tcp': 'current config',
  'nv-max-power': 'optimal power',
  'nv-disable-vsync': 'on',
  'nv-optimize-shader-cache': 'default',
  'nv-low-latency': 'off',
  'nv-hardware-scheduling': 'off',
  'debloat-disable-startup': 'enabled',
  'debloat-remove-background': 'running',
  'debloat-disable-telemetry': 'running',
  'debloat-disable-services': 'running',
  'debloat-superfetch': 'running',
  'mouse-disable-acceleration': 'on',
  'mouse-raw-input': 'off',
  'mouse-optimize-pointer': 'default',
  'mouse-polling-priority': 'default',
  'sys-high-performance': 'Balanced',
  'sys-enable-game-mode': false,
  'sys-disable-fullscreen-opt': 'enabled',
  'sys-visual-effects': 'let windows choose',
  'sys-cpu-priority': 'normal',
  'sys-disk-cleanup': 'not run',
}

const NEW_VALUES: Record<string, any> = {
  'net-disable-background-updates': 'disabled',
  'net-optimize-dns': 'Cloudflare 1.1.1.1',
  'net-reduce-congestion': 'optimized',
  'net-disable-throttling': 'disabled',
  'net-reset-tcp': 'reset',
  'nv-max-power': 'maximum performance',
  'nv-disable-vsync': 'off',
  'nv-optimize-shader-cache': 'cleared',
  'nv-low-latency': 'ultra',
  'nv-hardware-scheduling': 'on',
  'debloat-disable-startup': 'disabled',
  'debloat-remove-background': 'stopped',
  'debloat-disable-telemetry': 'stopped',
  'debloat-disable-services': 'stopped',
  'debloat-superfetch': 'stopped',
  'mouse-disable-acceleration': 'off',
  'mouse-raw-input': 'on',
  'mouse-optimize-pointer': 'optimized',
  'mouse-polling-priority': 'high',
  'sys-high-performance': 'High performance',
  'sys-enable-game-mode': true,
  'sys-disable-fullscreen-opt': 'disabled',
  'sys-visual-effects': 'best performance',
  'sys-cpu-priority': 'high',
  'sys-disk-cleanup': 'done',
}
