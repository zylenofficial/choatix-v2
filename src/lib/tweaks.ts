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
  'sys-high-performance': 'Balanced',
  'sys-enable-game-mode': false,
  'sys-disable-fullscreen-opt': 'enabled',
  'sys-disk-cleanup': 'not run',
  'nv-disable-vsync': 'on',
  'nv-low-latency': 'off',
  'nv-hardware-scheduling': 'off',
  'net-optimize-dns': 'ISP default',
  'net-reduce-congestion': 'default',
  'mouse-disable-acceleration': 'on',
  'storage-ssd-optimization': 'tracking on',
  'storage-trim-optimization': 'auto',
  'windows-explorer-optimization': 'Quick Access',
  'audio-disable-enhancements': 'enabled',
  'audio-usb-optimization': 'selective suspend on',
  'usb-selective-suspend-disable': 'enabled',
}

const NEW_VALUES: Record<string, any> = {
  'sys-high-performance': 'High performance',
  'sys-enable-game-mode': true,
  'sys-disable-fullscreen-opt': 'disabled',
  'sys-disk-cleanup': 'done',
  'nv-disable-vsync': 'off',
  'nv-low-latency': 'ultra',
  'nv-hardware-scheduling': 'on',
  'net-optimize-dns': 'Cloudflare 1.1.1.1',
  'net-reduce-congestion': 'CTCP',
  'mouse-disable-acceleration': 'off',
  'storage-ssd-optimization': 'tracking off',
  'storage-trim-optimization': 'forced',
  'windows-explorer-optimization': 'This PC',
  'audio-disable-enhancements': 'disabled',
  'audio-usb-optimization': 'suspend off',
  'usb-selective-suspend-disable': 'disabled',
}
