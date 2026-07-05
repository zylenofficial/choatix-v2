'use client'

import { LayoutDashboard, Zap, Gamepad2, Wrench, History, Settings, Lock, Shield } from 'lucide-react'

export type Page = 'dashboard' | 'optimize' | 'autopilot' | 'tools' | 'rollback' | 'settings' | 'scan' | 'best-tweaks' | 'optimizer' | 'process-optimizer' | 'ai-optimizer' | 'benchmark' | 'bios-guide' | 'live-overlay' | 'performance'

interface SidebarProps {
  active: Page
  onNavigate: (page: Page) => void
  tier: string
  onUpgrade: () => void
  rollbackCount: number
}

const NAV_ITEMS: { id: Page; label: string; icon: any; pro?: boolean; premium?: boolean }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'optimize', label: 'Optimize', icon: Zap },
  { id: 'autopilot', label: 'Game Booster', icon: Gamepad2 },
  { id: 'tools', label: 'Tools', icon: Wrench, pro: true },
  { id: 'rollback', label: 'Rollback', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ active, onNavigate, tier, onUpgrade, rollbackCount }: SidebarProps) {
  return (
    <aside className="w-60 h-full flex flex-col relative" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(24px) saturate(1.3)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Logo */}
      <div className="flex items-center px-5 py-5 relative">
        <img src="/choatix-logo.png" alt="CHOATIX" style={{ height: 32, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
      </div>

      <div className="mx-4 separator" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-2 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = active === item.id
            const isLocked = (item.premium && tier !== 'PREMIUM') || (item.pro && tier === 'FREE')
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
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(255,255,255,0.10)' }}>
                    {rollbackCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="mx-4 separator" />

      {/* Upgrade card */}
      <div className="p-3">
        <div className="upgrade-card-sidebar">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4" style={{ color: tier === 'PREMIUM' ? 'var(--success)' : tier === 'PRO' ? 'var(--info)' : 'var(--text-muted)' }} />
            <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
              {tier === 'FREE' ? 'Free Plan' : tier === 'PRO' ? 'Pro Plan' : 'Premium'}
            </span>
          </div>
          {tier === 'FREE' && (
            <>
              <div className="text-[12px] mb-3 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>Unlock all optimizations</div>
              <button
                onClick={onUpgrade}
                className="w-full h-8 rounded-lg text-[11px] font-bold btn-primary"
              >
                Upgrade
              </button>
            </>
          )}
          {tier !== 'FREE' && (
            <div className="flex items-center gap-1.5">
              <div className="live-dot" />
              <span className="text-[11px] font-semibold" style={{ color: 'var(--success)' }}>Active</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
