'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { availableTweaks } from '@/data/tweaks'
import { revertTweak } from '@/lib/tweaks'
import { useToast } from '@/components/Toast'
import { History, RotateCcw, Clock, Trash2, CheckCircle2, Loader2, Shield } from 'lucide-react'

export function RollbackPage() {
  const { rollbackEntries, appliedTweaks, setAppliedTweaks, removeRollbackEntry, clearRollbackEntries } = useStore()
  const { addToast } = useToast()

  const [reverting, setReverting] = useState<string | null>(null)

  const handleRevert = async (entryId: string) => {
    const entry = rollbackEntries.find(e => e.id === entryId)
    if (!entry) return
    setReverting(entryId)
    const success = await revertTweak(entry)
    if (success) {
      setAppliedTweaks(appliedTweaks.filter(id => id !== entry.tweakId))
      removeRollbackEntry(entryId)
      addToast(`${availableTweaks.find(t => t.id === entry.tweakId)?.name || entry.tweakId} reverted`, 'success')
    } else {
      addToast(`Failed to revert`, 'error')
    }
    setReverting(null)
  }

  const handleClearAll = async () => {
    if (window.electronAPI) {
      await window.electronAPI.restoreAll()
    }
    setAppliedTweaks([])
    clearRollbackEntries()
    addToast('All tweaks reverted', 'success')
  }

  return (
    <div className="h-full overflow-y-auto page-transition" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto p-6 space-y-5 fade-in">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ffffff' }}>
              <History className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Rollback</h1>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Revert any applied optimizations</p>
            </div>
          </div>
          {rollbackEntries.length > 0 && (
            <button onClick={handleClearAll}
              className="h-10 px-5 rounded-xl text-[11px] font-semibold flex items-center gap-2 transition-all"
              style={{ background: 'rgba(153,153,153,0.08)', color: '#999', border: '1px solid rgba(153,153,153,0.12)' }}>
              <Trash2 className="w-3.5 h-3.5" />Clear All
            </button>
          )}
        </div>

        {rollbackEntries.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 fade-in">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <History className="w-9 h-9 text-[var(--text-muted)]" />
            </div>
            <p className="text-base font-bold text-white mb-1">No rollback entries</p>
            <p className="text-xs text-[var(--text-muted)]">Applied optimizations will appear here</p>
          </div>
        ) : (
          <>
            {/* Status */}
            <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
              <div className="live-dot" />
              {rollbackEntries.length} optimization{rollbackEntries.length > 1 ? 's' : ''} applied
            </div>

            {/* Entries */}
            <div className="space-y-2 stagger">
              {rollbackEntries.map(entry => {
                const tweak = availableTweaks.find(t => t.id === entry.tweakId)
                return (
                  <div key={entry.id} className="rounded-2xl px-5 py-4 flex items-center gap-4"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-dim)' }}>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{tweak?.name || entry.tweakId}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                        <span className="text-[10px] text-[var(--text-muted)]">{entry.timestamp.toLocaleString()}</span>
                      </div>
                    </div>
                    {/* Revert button */}
                    <button onClick={() => handleRevert(entry.id)} disabled={reverting === entry.id}
                      className="h-9 px-4 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all duration-200 shrink-0"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                      {reverting === entry.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      {reverting === entry.id ? 'Reverting...' : 'Revert'}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
