'use client'

import { useState } from 'react'
import { LayoutDashboard, Zap, Gamepad2, Monitor, Settings, Shield, Target, Mouse, ScanSearch, ChevronRight, Fan } from 'lucide-react'

export type Page = 'home' | 'optimize' | 'quick-boost' | 'zero-delay' | 'scan' | 'games' | 'system' | 'settings' | 'fan-control'

interface SidebarProps {
  active: Page
  onNavigate: (page: Page) => void
  tier: string
  onUpgrade: () => void
  rollbackCount: number
}

const NAV_ITEMS: { id: Page; label: string; icon: any }[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'scan', label: 'Scan PC', icon: ScanSearch },
  { id: 'optimize', label: 'Optimize', icon: Zap },
  { id: 'quick-boost', label: 'Quick Boost', icon: Target },
  { id: 'zero-delay', label: '0 Delay', icon: Mouse },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'fan-control', label: 'Fan Control', icon: Fan },
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ active, onNavigate, tier, onUpgrade, rollbackCount }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <aside className="w-60 h-full flex flex-col relative overflow-hidden" style={{
      background: 'rgba(0,0,0,0.75)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Top ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.04) 0%, transparent 70%)',
      }} />

      {/* Brand */}
      <div className="px-5 py-5 relative" style={{ zIndex: 1 }}>
        <div className="text-[13px] font-bold tracking-tight" style={{ color: '#fff' }}>CHOATIX</div>
        <div className="text-[9px] tracking-[0.15em] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>V2</div>
      </div>

      <div className="mx-4 glow-divider" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 relative" style={{ zIndex: 1 }}>
        <div className="px-2.5 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = active === item.id
            const isHovered = hoveredItem === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150 relative overflow-hidden group"
                style={{
                  background: isActive
                    ? 'rgba(255,255,255,0.07)'
                    : isHovered
                      ? 'rgba(255,255,255,0.03)'
                      : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                  boxShadow: isActive
                    ? 'inset 0 0 20px rgba(255,255,255,0.03), 0 0 16px rgba(255,255,255,0.02)'
                    : 'none',
                }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[55%] rounded-r-full transition-all duration-150" style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3))',
                    boxShadow: '0 0 8px rgba(255,255,255,0.2)',
                  }} />
                )}

                {/* Icon container */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150" style={{
                  background: isActive
                    ? 'rgba(255,255,255,0.08)'
                    : isHovered
                      ? 'rgba(255,255,255,0.04)'
                      : 'transparent',
                  boxShadow: isActive
                    ? '0 0 12px rgba(255,255,255,0.05)'
                    : 'none',
                }}>
                  <Icon
                    className="w-4 h-4 transition-all duration-150"
                    strokeWidth={isActive ? 2 : 1.5}
                    style={{
                      color: isActive ? '#fff' : isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
                      transform: isHovered && !isActive ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                </div>

                {/* Label */}
                <span className={`flex-1 text-[12.5px] transition-all duration-150 ${isActive ? 'font-semibold' : 'font-medium'}`}
                  style={{
                    color: isActive ? '#fff' : isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
                  }}>
                  {item.label}
                </span>

                {/* Hover arrow */}
                <ChevronRight className="w-3 h-3 transition-all duration-150 shrink-0" style={{
                  opacity: isHovered && !isActive ? 1 : 0,
                  transform: isHovered && !isActive ? 'translateX(0)' : 'translateX(-4px)',
                  color: 'rgba(255,255,255,0.2)',
                }} />

                {/* Settings badge */}
                {item.id === 'settings' && rollbackCount > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center transition-all duration-150" style={{
                    background: 'var(--accent-dim)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 0 8px rgba(255,255,255,0.05)',
                  }}>
                    {rollbackCount}
                  </span>
                )}

                {/* Hover ripple effect */}
                {isHovered && !isActive && (
                  <div className="absolute inset-0 pointer-events-none rounded-xl" style={{
                    background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.04) 0%, transparent 60%)',
                  }} />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="mx-4 glow-divider" />

      {/* Upgrade Card */}
      <div className="p-3">
        <div className="relative rounded-xl p-3.5 overflow-hidden transition-all duration-400" style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
          {/* Subtle glow */}
          <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full pointer-events-none" style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
          }} />

          <div className="flex items-center gap-2 mb-2 relative" style={{ zIndex: 1 }}>
            <Shield className="w-4 h-4 transition-colors duration-150" style={{
              color: tier === 'PREMIUM' ? 'var(--success)' : tier === 'PRO' ? 'var(--info)' : 'rgba(255,255,255,0.3)',
            }} />
            <span className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {tier === 'FREE' ? 'Free Plan' : tier === 'PRO' ? 'Pro Plan' : 'Premium'}
            </span>
          </div>
          {tier === 'FREE' && (
            <>
              <div className="text-[11px] mb-2.5 leading-relaxed relative" style={{ color: 'rgba(255,255,255,0.3)', zIndex: 1 }}>
                Unlock all optimizations
              </div>
              <button onClick={onUpgrade}
                className="w-full h-8 rounded-lg text-[11px] font-bold btn-primary ripple relative transition-all duration-150 hover:shadow-lg"
                style={{ zIndex: 1, boxShadow: '0 2px 8px rgba(255,255,255,0.1)' }}>
                Upgrade
              </button>
            </>
          )}
          {tier !== 'FREE' && (
            <div className="flex items-center gap-2 relative" style={{ zIndex: 1 }}>
              <div className="live-dot" />
              <span className="text-[11px] font-semibold" style={{ color: 'var(--success)' }}>Active</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
