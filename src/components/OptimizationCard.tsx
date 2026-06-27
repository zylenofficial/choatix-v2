'use client'

import { AdvisorIssue, LicenseTier } from '@/types'
import { canAccessTier } from '@/lib/featureAccess'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Undo2, AlertTriangle, AlertCircle, Info } from 'lucide-react'

interface OptimizationCardProps {
  issue: AdvisorIssue
  userTier: LicenseTier
  onFix: (issue: AdvisorIssue) => void
  onIgnore: (issueId: string) => void
  isFixing: boolean
  isApplied: boolean
}

const SEVERITY_CONFIG = {
  high: {
    label: 'HIGH',
    icon: AlertTriangle,
    iconColor: 'text-white/60',
    badgeClass: 'bg-white/10 text-white/70',
    borderColor: 'border-white/[0.08] hover:border-white/[0.15]',
  },
  medium: {
    label: 'MEDIUM',
    icon: AlertCircle,
    iconColor: 'text-white/40',
    badgeClass: 'bg-white/5 text-white/50',
    borderColor: 'border-white/[0.06] hover:border-white/[0.12]',
  },
  low: {
    label: 'LOW',
    icon: Info,
    iconColor: 'text-white/30',
    badgeClass: 'bg-white/5 text-white/35',
    borderColor: 'border-white/[0.06] hover:border-white/[0.1]',
  },
}

export function OptimizationCard({
  issue,
  userTier,
  onFix,
  onIgnore,
  isFixing,
  isApplied,
}: OptimizationCardProps) {
  const hasAccess = canAccessTier(userTier, issue.requiredTier)
  const sev = SEVERITY_CONFIG[issue.severity]
  const SevIcon = sev.icon

  return (
    <div className={`border ${sev.borderColor} bg-[#0a0a0a] p-5 transition-colors`}>
      <div className="flex items-start gap-4">
        {/* Severity icon */}
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
          <SevIcon className={`w-4 h-4 ${sev.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[13px] font-medium text-white/85">{issue.title}</span>
            <Badge className={`text-[8px] font-bold tracking-wider px-1.5 py-0 ${sev.badgeClass}`}>
              {sev.label}
            </Badge>
          </div>

          <p className="text-[11px] text-white/30 leading-relaxed mb-3">{issue.description}</p>

          <div className="flex items-center gap-4">
            <div className="text-[10px] text-white/35">
              <span className="text-white/20 uppercase tracking-wider">Impact</span>{' '}
              {issue.gamingImpact}
            </div>
            {issue.undoable && (
              <div className="flex items-center gap-1 text-[10px] text-white/20">
                <Undo2 className="w-3 h-3" />
                <span>Reversible</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isApplied ? (
            <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
              Applied
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isFixing}
                onClick={() => {
                  if (!hasAccess) return
                  onFix(issue)
                }}
                className="h-7 text-[11px]"
              >
                {!hasAccess && <Lock className="w-3 h-3 mr-1" />}
                {isFixing ? (
                  <span className="flex items-center gap-1.5">
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    Fixing
                  </span>
                ) : (
                  'Fix'
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onIgnore(issue.id)}
                className="h-7 text-[10px] text-white/25 hover:text-white/50"
              >
                Dismiss
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
