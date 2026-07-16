'use client'

import { useState } from 'react'
import { Search, BarChart3, Activity, Timer, Cpu, Gamepad2 } from 'lucide-react'
import { DiagnosticsPage } from './DiagnosticsPage'
import { BenchmarkPage } from './BenchmarkPage'
import { LiveOverlayPage } from './LiveOverlayPage'
import { TimerResolutionPage } from './TimerResolutionPage'
import { ProcessOptimizerPage } from './ProcessOptimizerPage'
import { FpsComparisonPage } from './FpsComparisonPage'

type Tab = 'diagnostics' | 'benchmark' | 'fps' | 'monitor' | 'timer' | 'process'

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'diagnostics', label: 'Diagnostics', icon: Search },
  { id: 'benchmark', label: 'Benchmark', icon: BarChart3 },
  { id: 'fps', label: 'FPS Compare', icon: Gamepad2 },
  { id: 'monitor', label: 'Live Monitor', icon: Activity },
  { id: 'timer', label: 'Timer', icon: Timer },
  { id: 'process', label: 'Processes', icon: Cpu },
]

export function SystemPage() {
  const [tab, setTab] = useState<Tab>('diagnostics')

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex gap-1 px-6 pt-5 pb-3" style={{ scrollbarWidth: 'thin' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all duration-300 shrink-0 btn-press"
              style={{
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: active ? '#fff' : 'var(--text-muted)',
                border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              }}>
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          )
        })}
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === 'diagnostics' && <DiagnosticsPage />}
        {tab === 'benchmark' && <BenchmarkPage />}
        {tab === 'fps' && <FpsComparisonPage />}
        {tab === 'monitor' && <LiveOverlayPage />}
        {tab === 'timer' && <TimerResolutionPage />}
        {tab === 'process' && <ProcessOptimizerPage />}
      </div>
    </div>
  )
}
