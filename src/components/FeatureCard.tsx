'use client'

import { LicenseTier, Feature } from '@/types'
import { canAccess } from '@/lib/featureAccess'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Zap, TrendingUp, Shield } from 'lucide-react'

interface FeatureCardProps {
  feature: Feature
  userTier: LicenseTier
  onAction?: () => void
  actionLabel?: string
  showUpgradeModal?: () => void
}

export function FeatureCard({ 
  feature, 
  userTier, 
  onAction, 
  actionLabel = 'Execute',
  showUpgradeModal 
}: FeatureCardProps) {
  const hasAccess = canAccess(feature.id, userTier)
  
  const getTierColor = (tier: LicenseTier) => {
    switch (tier) {
      case LicenseTier.FREE: return 'bg-green-500'
      case LicenseTier.PRO: return 'bg-blue-500'
      case LicenseTier.PREMIUM: return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getTierLabel = (tier: LicenseTier) => {
    switch (tier) {
      case LicenseTier.FREE: return 'FREE'
      case LicenseTier.PRO: return 'PRO'
      case LicenseTier.PREMIUM: return 'PREMIUM'
      default: return tier
    }
  }

  const handleActionClick = () => {
    if (hasAccess && onAction) {
      onAction()
    } else if (!hasAccess && showUpgradeModal) {
      showUpgradeModal()
    }
  }

  const getGamingIcon = () => {
    switch (feature.category) {
      case 'scan': return <TrendingUp className="w-4 h-4" />
      case 'tweak': return <Zap className="w-4 h-4" />
      case 'autopilot': return <Zap className="w-4 h-4" />
      case 'undo': return <Shield className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 mb-2">
              {getGamingIcon()}
              {feature.name}
            </CardTitle>
            <CardDescription>{feature.description}</CardDescription>
          </div>
          <Badge className={`${getTierColor(feature.tier)} text-white`}>
            {getTierLabel(feature.tier)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Gaming Impact Section - ALWAYS VISIBLE */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Gaming Impact</span>
            </div>
            <p className="text-sm text-muted-foreground">{feature.gamingImpact}</p>
          </div>

          {/* Action Button - LOCKED IF NO ACCESS */}
          <Button
            className="w-full"
            variant={hasAccess ? 'default' : 'outline'}
            onClick={handleActionClick}
            disabled={!hasAccess && !showUpgradeModal}
          >
            {!hasAccess && (
              <Lock className="w-4 h-4 mr-2" />
            )}
            {hasAccess ? actionLabel : `Unlock ${getTierLabel(feature.tier)}`}
          </Button>

          {/* Upgrade Hint - ONLY SHOW IF LOCKED */}
          {!hasAccess && (
            <p className="text-xs text-center text-muted-foreground">
              Upgrade to {getTierLabel(feature.tier)} to access this feature
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
