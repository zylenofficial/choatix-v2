'use client'

import { LayoutDashboard, ScanSearch, Zap, Gauge, History, Settings, Gamepad2, Sparkles, Bot, Lock, Cpu, Shield, BarChart3, BookOpen, Activity } from 'lucide-react'

export type Page = 'dashboard' | 'scan' | 'optimizer' | 'best-tweaks' | 'autopilot' | 'performance' | 'rollback' | 'settings' | 'ai-optimizer' | 'process-optimizer' | 'benchmark' | 'bios-guide' | 'live-overlay'

interface SidebarProps {
  active: Page
  onNavigate: (page: Page) => void
  tier: string
  onUpgrade: () => void
  rollbackCount: number
}

const NAV_SECTIONS: { label?: string; items: { id: Page; label: string; icon: any; premium?: boolean; pro?: boolean }[] }[] = [
  {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: 'Optimize',
    items: [
      { id: 'scan', label: 'Scan', icon: ScanSearch },
      { id: 'best-tweaks', label: 'Best Tweaks', icon: Sparkles },
      { id: 'optimizer', label: 'Optimizer', icon: Zap },
      { id: 'process-optimizer', label: 'Processes', icon: Cpu },
      { id: 'autopilot', label: 'Game Optimizer', icon: Gamepad2 },
      { id: 'ai-optimizer', label: 'System Optimizer', icon: Bot, premium: true },
    ]
  },
  {
    label: 'Tools',
    items: [
      { id: 'benchmark', label: 'Benchmark', icon: BarChart3 },
      { id: 'live-overlay', label: 'Live Monitor', icon: Activity, pro: true },
      { id: 'bios-guide', label: 'BIOS Guide', icon: BookOpen, pro: true },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'performance', label: 'Performance', icon: Gauge },
      { id: 'rollback', label: 'Rollback', icon: History },
      { id: 'settings', label: 'Settings', icon: Settings },
    ]
  }
]

export function Sidebar({ active, onNavigate, tier, onUpgrade, rollbackCount }: SidebarProps) {
  return (
    <aside className="w-60 h-full flex flex-col relative" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(24px) saturate(1.3)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Logo */}
      <div className="flex items-center px-5 py-5 relative">
        <img src="/choatix-logo.png" alt="CHOATIX" style={{ height: 60, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
      </div>

      <div className="mx-4 separator" />

      {/* Nav with sections */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className="mb-1">
            {section.label && (
              <div className="sidebar-section-label">{section.label}</div>
            )}
            <div className="px-2 space-y-0.5">
              {section.items.map(item => {
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
          </div>
        ))}
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
