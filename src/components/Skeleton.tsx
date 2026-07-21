'use client'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div className="skeleton-shimmer" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <Skeleton style={{ width: 80, height: 10, marginBottom: 8 }} />
          <Skeleton style={{ width: 160, height: 24 }} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex gap-4 mb-5">
        <Skeleton style={{ width: 220, height: 280, borderRadius: 16 }} />
        <div className="flex-1 grid grid-rows-3 gap-2.5">
          <Skeleton style={{ height: 72, borderRadius: 12 }} />
          <Skeleton style={{ height: 72, borderRadius: 12 }} />
          <Skeleton style={{ height: 72, borderRadius: 12 }} />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} style={{ height: 100, borderRadius: 12 }} />
        ))}
      </div>

      {/* Network */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} style={{ height: 56, borderRadius: 12 }} />
        ))}
      </div>

      {/* Bottom */}
      <div className="flex gap-3">
        <Skeleton style={{ flex: 1, height: 56, borderRadius: 12 }} />
        <Skeleton style={{ width: 200, height: 56, borderRadius: 12 }} />
      </div>
    </div>
  )
}
