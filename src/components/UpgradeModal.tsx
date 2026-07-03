'use client'

import { LicenseTier } from '@/types'
import { useStore } from '@/store/useStore'
import { X, Check, Zap, Crown, Shield } from 'lucide-react'

const DISCORD_URL = 'https://discord.gg/Y92hMwVaUc'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier: LicenseTier
}

const PLANS = [
  {
    tier: LicenseTier.FREE,
    name: 'Free',
    price: '€0',
    period: '',
    description: 'Get started',
    features: ['Basic system scan', '1 game profile', 'Essential optimizations'],
    icon: Shield,
    color: 'var(--text-muted)',
    recommended: false,
  },
  {
    tier: LicenseTier.PRO,
    name: 'Pro',
    price: '€4.99',
    period: '/key',
    description: 'Advanced optimizations',
    features: ['All FREE features', 'Unlimited games', 'NVIDIA/AMD tweaks', 'Network optimization', 'Service presets'],
    icon: Zap,
    color: 'var(--accent)',
    recommended: false,
  },
  {
    tier: LicenseTier.PREMIUM,
    name: 'Premium',
    price: '€7.99',
    period: '/key',
    description: 'Complete power',
    features: ['All PRO features', 'Full system restore', 'Priority support', 'Beta features', 'Exclusive tweaks'],
    icon: Crown,
    color: '#cccccc',
    recommended: true,
  },
]

export function UpgradeModal({ isOpen, onClose, currentTier }: UpgradeModalProps) {
  if (!isOpen) return null

  const isCurrent = (tier: LicenseTier) => currentTier === tier

  const handleGet = (tier: LicenseTier) => {
    if (isCurrent(tier)) return
    window.open(DISCORD_URL, '_blank')
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 modal-overlay" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <div className="w-full max-w-2xl modal-content" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h2 className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Choose Your Plan</h2>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Unlock the full power of Choatix</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:bg-white/[0.06]" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-3 gap-3 p-5 stagger">
          {PLANS.map(plan => {
            const Icon = plan.icon
            const current = isCurrent(plan.tier)
            return (
              <div key={plan.tier} className="rounded-xl p-5 relative transition-all duration-300 hover-lift" style={{
                border: plan.recommended ? `2px solid ${plan.color}` : `1px solid ${current ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                background: plan.recommended ? `linear-gradient(145deg, ${plan.color}08 0%, var(--bg-primary) 60%)` : current ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
              }}>
                {plan.recommended && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[7px] font-bold tracking-widest uppercase px-3 py-0.5 rounded-full" style={{ background: plan.color, color: '#000' }}>
                    Best Value
                  </div>
                )}
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${plan.color}10`, border: `1px solid ${plan.color}20` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: plan.color }} />
                    </div>
                    <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>{plan.name}</div>
                  </div>
                  <div className="flex items-baseline gap-0.5 mb-1">
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan.price}</div>
                    {plan.period && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>}
                  </div>
                  <p className="text-[10px] mb-3" style={{ color: 'var(--text-tertiary)' }}>{plan.description}</p>
                  <div className="space-y-1.5 mb-4">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3" style={{ color: plan.color }} />
                        <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    disabled={current}
                    className="w-full h-9 rounded-lg text-[11px] font-bold transition-all duration-200"
                    style={{
                      background: current ? 'var(--bg-elevated)' : plan.recommended ? '#000' : 'var(--accent)',
                      color: current ? 'var(--text-muted)' : plan.recommended ? '#fff' : '#000',
                      cursor: current ? 'default' : 'pointer',
                      boxShadow: !current ? `0 4px 14px ${plan.color}30` : 'none',
                    }}
                    onClick={() => handleGet(plan.tier)}
                  >
                    {current ? 'Current' : plan.tier === LicenseTier.FREE ? 'Get Started' : `Get ${plan.name}`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Join the <span className="font-bold" style={{ color: 'var(--accent)' }}>CHOATIX</span> Discord to purchase
        </div>
      </div>
    </div>
  )
}
