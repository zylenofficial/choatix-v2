'use client'

import { LayoutDashboard, ScanSearch, Zap, Gauge, History, Settings, Gamepad2, Sparkles, Bot, Lock, Cpu } from 'lucide-react'

export type Page = 'dashboard' | 'scan' | 'optimizer' | 'best-tweaks' | 'autopilot' | 'performance' | 'rollback' | 'settings' | 'ai-optimizer' | 'process-optimizer'

interface SidebarProps {
  active: Page
  onNavigate: (page: Page) => void
  tier: string
  onUpgrade: () => void
  rollbackCount: number
}

const NAV: { id: Page; label: string; icon: any; premium?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scan', label: 'Scan', icon: ScanSearch },
  { id: 'best-tweaks', label: 'Best Tweaks', icon: Sparkles },
  { id: 'optimizer', label: 'Optimizer', icon: Zap },
  { id: 'process-optimizer', label: 'Process Optimizer', icon: Cpu },
  { id: 'autopilot', label: 'Game Optimizer', icon: Gamepad2 },
  { id: 'ai-optimizer', label: 'System Optimizer', icon: Bot, premium: true },
  { id: 'performance', label: 'Performance', icon: Gauge },
  { id: 'rollback', label: 'Rollback', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ active, onNavigate, tier, onUpgrade, rollbackCount }: SidebarProps) {
  return (
    <aside className="w-56 h-full flex flex-col relative" style={{ background: '#000000', borderRight: '1px solid var(--border-subtle)' }}>
      {/* Logo */}
      <div className="flex items-center px-5 py-4 relative">
        <img src="/choatix-logo.png" alt="CHOATIX" style={{ height: 100, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
      </div>

      <div className="mx-4 separator" />

      {/* Nav */}
      <nav className="flex-1 p-2.5 space-y-0.5 mt-2">
        {NAV.map(item => {
          const Icon = item.icon
          const isActive = active === item.id
          const isLocked = item.premium && tier !== 'PREMIUM'
          return (
            <button
              key={item.id}
              onClick={() => {
                if (isLocked) { onUpgrade(); return }
                onNavigate(item.id)
              }}
              className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
              style={{ opacity: isLocked ? 0.4 : 1 }}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.5} />
              <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
              {isLocked && <Lock className="w-3 h-3 ml-auto text-[var(--text-muted)]" />}
              {item.id === 'rollback' && rollbackCount > 0 && (
                <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  {rollbackCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="mx-4 separator" />

      {/* Upgrade card */}
      <div className="p-3">
        <div className="rounded-xl p-3.5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="relative">
            <div className="text-[8px] font-bold tracking-[0.15em] uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>
              {tier === 'FREE' ? 'Free Plan' : tier === 'PRO' ? 'Pro Plan' : 'Premium Plan'}
            </div>
            {tier === 'FREE' && (
              <>
                <div className="text-[10px] mb-2.5 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>Unlock all optimizations</div>
                <button
                  onClick={onUpgrade}
                  className="w-full h-7 rounded-lg text-[10px] font-bold btn-primary"
                >
                  Upgrade
                </button>
              </>
            )}
            {tier !== 'FREE' && (
              <div className="flex items-center gap-1.5">
                <div className="live-dot" />
                <span className="text-[10px] font-semibold" style={{ color: 'var(--success)' }}>Active</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
