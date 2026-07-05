'use client'
import { useState } from 'react'
import { Zap, Sparkles, List } from 'lucide-react'
import { ScanPage } from './ScanPage'
import { BestTweaksPage } from './BestTweaksPage'
import { OptimizerPage } from './OptimizerPage'

type Tab = 'quick' | 'best' | 'all'
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'quick', label: 'Quick Fix', icon: Zap },
  { id: 'best', label: 'Best Tweaks', icon: Sparkles },
  { id: 'all', label: 'All Tweaks', icon: List },
]

export function OptimizeHub() {
  const [tab, setTab] = useState<Tab>('quick')
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-1 px-6 pt-5 pb-3">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all btn-press"
              style={{
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: active ? '#fff' : 'var(--text-muted)',
                border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              }}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === 'quick' && <ScanPage />}
        {tab === 'best' && <BestTweaksPage />}
        {tab === 'all' && <OptimizerPage />}
      </div>
    </div>
  )
}
