'use client'

import { useEffect } from 'react'

type Page = 'home' | 'optimize' | 'quick-boost' | 'zero-delay' | 'scan' | 'games' | 'leaderboard' | 'system' | 'settings'

const SHORTCUTS: Record<string, Page> = {
  '1': 'home',
  '2': 'optimize',
  '3': 'quick-boost',
  '4': 'zero-delay',
  '5': 'scan',
  '6': 'games',
  '7': 'leaderboard',
  '8': 'system',
  '9': 'settings',
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const page = SHORTCUTS[e.key]
      if (page) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('choatix-navigate', { detail: page }))
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
