'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  itemCount?: number
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Apply All',
  itemCount,
}: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md border border-white/10 bg-[#0a0a0a] p-6 fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium tracking-wide text-white/90">{title}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-white/40 leading-relaxed mb-2">{description}</p>

        {itemCount !== undefined && (
          <p className="text-[11px] text-white/50 mb-6">
            {itemCount} optimization{itemCount !== 1 ? 's' : ''} will be applied.
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1 h-8 text-[11px]">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => { onConfirm(); onClose() }}
            className="flex-1 h-8 text-[11px]"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
